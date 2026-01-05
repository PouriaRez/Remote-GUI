import asyncio
import json
from contextlib import AsyncExitStack
from typing import Any, Dict, List, Optional

import ollama
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client


ANYLOG_MCP_SSE_URL = "http://23.239.12.151:32349/mcp/sse"  # <-- change
# OLLAMA_MODEL = "gpt-oss:20b"
OLLAMA_MODEL = "qwen2.5:7b-instruct"
# or "mistral:7b-instruct"
# or "llama3.1:8b-instruct"

def sanitize_json_schema(schema: dict) -> dict:
    """
    Fix common JSON Schema mistakes that break Ollama tool validation.
    - Move 'required' out of properties if incorrectly placed there.
    - Fix properties that are lists instead of proper schema objects.
    - Recursively sanitize nested schemas.
    """
    if not isinstance(schema, dict):
        return {"type": "object", "properties": {}}

    # Make a copy to avoid mutating the original
    schema = dict(schema)
    
    # Recursively sanitize nested schemas (items, properties, etc.)
    if "items" in schema and isinstance(schema["items"], dict):
        schema["items"] = sanitize_json_schema(schema["items"])
    
    if "properties" in schema and isinstance(schema["properties"], dict):
        sanitized_props = {}
        for prop_name, prop_value in schema["properties"].items():
            # Skip 'required' if it's incorrectly nested in properties
            if prop_name == "required" and isinstance(prop_value, list):
                continue
            
            # Fix properties that are lists instead of objects
            if isinstance(prop_value, list):
                # If it's a list, convert to array type with items
                # This handles cases like: "nodes": [{"type": "string"}] 
                # Should become: "nodes": {"type": "array", "items": {"type": "string"}}
                if len(prop_value) > 0 and isinstance(prop_value[0], dict):
                    # Assume it's an array of objects
                    sanitized_props[prop_name] = {
                        "type": "array",
                        "items": sanitize_json_schema(prop_value[0])
                    }
                else:
                    # Fallback: make it a generic array
                    sanitized_props[prop_name] = {
                        "type": "array",
                        "items": {"type": "string"}
                    }
            elif isinstance(prop_value, dict):
                # Recursively sanitize nested property schemas
                sanitized_props[prop_name] = sanitize_json_schema(prop_value)
            else:
                # Keep as-is if it's already a valid type
                sanitized_props[prop_name] = prop_value
        
        schema["properties"] = sanitized_props
    
    # Move 'required' from properties to top-level if incorrectly placed
    props = schema.get("properties", {})
    if isinstance(props, dict) and "required" in props and isinstance(props["required"], list):
        schema_required = props["required"]
        props = dict(props)
        props.pop("required", None)
        schema["properties"] = props
        # Merge/override required at top-level
        if "required" not in schema or not isinstance(schema["required"], list):
            schema["required"] = schema_required
        else:
            # Merge if both exist
            existing = set(schema["required"])
            new = set(schema_required)
            schema["required"] = list(existing | new)

    return schema

def mcp_tools_to_ollama_tools(mcp_tools) -> List[Dict[str, Any]]:
    """
    Convert MCP tool schema to Ollama tool schema:
    Ollama expects: [{"type":"function","function":{"name","description","parameters"}}]
    """
    out = []
    for t in mcp_tools:
        out.append(
            {
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": t.description or "",
                    "parameters": sanitize_json_schema(t.inputSchema or {"type": "object", "properties": {}}),
                },
            }
        )
    return out


async def ollama_chat_async(**kwargs):
    # ollama.chat is sync; run it without blocking the event loop
    return await asyncio.to_thread(ollama.chat, **kwargs)


class AnyLogMCPAgent:
    def __init__(self, anylog_sse_url: str):
        self.anylog_sse_url = anylog_sse_url
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

    async def connect(self):
        # Start mcp-proxy as a stdio "server" process that bridges to remote SSE
        server_params = StdioServerParameters(
            command="mcp-proxy",
            args=[self.anylog_sse_url],  # stdio -> remote SSE
            env=None,
        )
        stdio_transport = await self.exit_stack.enter_async_context(stdio_client(server_params))
        self.stdio, self.write = stdio_transport
        self.session = await self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write))
        await self.session.initialize()

        tools_resp = await self.session.list_tools()
        print("Connected. MCP tools:", [t.name for t in tools_resp.tools])

    async def ask(self, user_prompt: str) -> str:
        assert self.session is not None

        # Pull MCP tools and expose them to Ollama as tool schemas
        tools_resp = await self.session.list_tools()
        ollama_tools = mcp_tools_to_ollama_tools(tools_resp.tools)

        messages: List[Dict[str, Any]] = [
            {
                "role": "system",
                "content": (
                    "You are a maintenance copilot for PLC-controlled units. "
                    "You cannot access AnyLog data unless you call tools. "
                    "ALWAYS call tools to fetch facts before concluding. "
                    "If the user asks about trends or anomalies, call executeQuery or queryWithIncrement. "
                    "Never guess signal values. "
                    "If required identifiers are missing, ask for dbms/table/unit/device."
                ),
            },
            {"role": "user", "content": user_prompt},
        ]

        # Agent loop: model decides tool calls; we execute them via MCP; feed results back
        for _ in range(12):  # safety loop cap
            resp = await ollama_chat_async(
                model=OLLAMA_MODEL,
                messages=messages,
                tools=ollama_tools,
                stream=False,
            )

            msg = resp["message"]
            messages.append(msg)

            tool_calls = msg.get("tool_calls") or []
            if not tool_calls:
                return msg.get("content", "")

            # Execute each tool call against AnyLog MCP
            for tc in tool_calls:
                fn = tc["function"]
                tool_name = fn["name"]
                tool_args = fn.get("arguments") or {}
                if isinstance(tool_args, str):
                    tool_args = json.loads(tool_args)

                result = await self.session.call_tool(tool_name, tool_args)

                # Feed tool result back to the model
                messages.append(
                    {
                        "role": "tool",
                        "tool_name": tool_name,
                        "content": json.dumps(result.model_dump() if hasattr(result, "model_dump") else result, default=str),
                    }
                )

        return "Stopped (too many tool-call iterations). Try narrowing the question."

    async def close(self):
        await self.exit_stack.aclose()


async def main():
    agent = AnyLogMCPAgent(ANYLOG_MCP_SSE_URL)
    await agent.connect()

    # Example prompt
    try:
        while True:
            q = input("\nAsk> ").strip()
            if q.lower() in ("exit", "quit"):
                break
            answer = await agent.ask(q)
            print("\n--- ANSWER ---\n", answer)
    finally:
        await agent.close()


    '''
    answer = await agent.ask(
        "For unit 250 device AIC-12, check the last 7 days and identify signals drifting out of baseline. "
        "Summarize likely maintenance concerns and what to verify on-site."
    )
    print("\n--- FINAL ANSWER ---\n", answer)
    await agent.close()
    '''


if __name__ == "__main__":
    asyncio.run(main())
