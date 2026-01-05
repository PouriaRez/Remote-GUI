"""
MCP Agent for AnyLog integration with Ollama
Based on ollama_demo.py
"""
import asyncio
import json
from contextlib import AsyncExitStack
from typing import Any, Dict, List, Optional
import os

try:
    import ollama
    HAS_OLLAMA = True
except ImportError:
    HAS_OLLAMA = False
    ollama = None

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    HAS_MCP = True
except ImportError:
    HAS_MCP = False
    ClientSession = None
    StdioServerParameters = None
    stdio_client = None

# Default configuration - can be overridden via environment variables
DEFAULT_ANYLOG_MCP_SSE_URL = os.getenv("ANYLOG_MCP_SSE_URL", "http://10.0.0.78:7849/mcp/sse")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")

def sanitize_json_schema(schema: dict) -> dict:
    """
    Fix common JSON Schema mistakes that break Ollama tool validation.
    - Move 'required' out of properties if incorrectly placed there.
    """
    if not isinstance(schema, dict):
        return {"type": "object", "properties": {}}

    if schema.get("type") != "object":
        return schema

    props = schema.get("properties")
    if isinstance(props, dict) and "required" in props and isinstance(props["required"], list):
        # move it to the correct place
        schema = dict(schema)  # shallow copy
        schema_required = props["required"]
        props = dict(props)
        props.pop("required", None)
        schema["properties"] = props
        # merge/override required at top-level
        schema["required"] = schema_required

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
    """Run ollama.chat without blocking the event loop"""
    if not HAS_OLLAMA:
        raise RuntimeError("Ollama is not installed. Please install it with: pip install ollama")
    # ollama.chat is sync; run it without blocking the event loop
    return await asyncio.to_thread(ollama.chat, **kwargs)


class AnyLogMCPAgent:
    def __init__(self, anylog_sse_url: str, ollama_model: str = DEFAULT_OLLAMA_MODEL):
        self.anylog_sse_url = anylog_sse_url
        self.ollama_model = ollama_model
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()

    async def connect(self):
        """Connect to AnyLog MCP server via mcp-proxy"""
        if not HAS_MCP:
            raise RuntimeError("MCP libraries are not installed. Please install them with: pip install mcp")
        
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
        return [t.name for t in tools_resp.tools]

    async def ask(self, user_prompt: str) -> str:
        """Ask a question to the MCP agent using Ollama"""
        if not self.session:
            raise RuntimeError("Not connected. Call connect() first.")
        
        if not HAS_OLLAMA:
            raise RuntimeError("Ollama is not installed. Please install it with: pip install ollama")

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
                model=self.ollama_model,
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
        """Close the MCP connection"""
        await self.exit_stack.aclose()

