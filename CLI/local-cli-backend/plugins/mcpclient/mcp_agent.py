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
DEFAULT_ANYLOG_MCP_SSE_URL = os.getenv("ANYLOG_MCP_SSE_URL", "http://50.116.13.109:32349/mcp/sse")
DEFAULT_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")

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
        self.exit_stack: Optional[AsyncExitStack] = None
        self.stdio = None
        self.write = None
        self.cached_tools: List[str] = []  # Cache tools to avoid redundant API calls

    async def connect(self, timeout: float = 10.0):
        """Connect to AnyLog MCP server via mcp-proxy with timeout"""
        if not HAS_MCP:
            raise RuntimeError("MCP libraries are not installed. Please install them with: pip install mcp")
        
        # Create a new exit stack for this connection
        self.exit_stack = AsyncExitStack()
        
        # Start mcp-proxy as a stdio "server" process that bridges to remote SSE
        server_params = StdioServerParameters(
            command="mcp-proxy",
            args=[self.anylog_sse_url],  # stdio -> remote SSE
            env=None,
        )
        
        # Connect with timeout to prevent hanging
        try:
            stdio_transport = await asyncio.wait_for(
                self.exit_stack.enter_async_context(stdio_client(server_params)),
                timeout=timeout
            )
            self.stdio, self.write = stdio_transport
            self.session = await asyncio.wait_for(
                self.exit_stack.enter_async_context(ClientSession(self.stdio, self.write)),
                timeout=timeout
            )
            await asyncio.wait_for(self.session.initialize(), timeout=timeout)

            # Cache tools for fast status checks (with timeout)
            tools_resp = await asyncio.wait_for(self.session.list_tools(), timeout=timeout)
            self.cached_tools = [t.name for t in tools_resp.tools]
            return self.cached_tools
        except asyncio.TimeoutError:
            # Clean up on timeout
            try:
                await self.close()
            except Exception:
                pass
            raise RuntimeError(f"Connection timeout after {timeout}s. MCP server may be unreachable or overloaded.")

    async def health_check(self, timeout: float = 3.0) -> bool:
        """Verify the MCP connection is actually working with timeout"""
        if not self.session:
            return False
        
        try:
            # Try a lightweight operation to verify connection is alive
            # Use a short timeout to avoid blocking
            await asyncio.wait_for(self.session.list_tools(), timeout=timeout)
            return True
        except (asyncio.TimeoutError, Exception) as e:
            # Connection is dead, mark as disconnected
            print(f"Health check failed: {e}")
            return False

    async def ask(self, user_prompt: str, conversation_history: Optional[List[Dict[str, str]]] = None, timeout: float = 120.0) -> str:
        """Ask a question to the MCP agent using Ollama with timeout and conversation history"""
        if not self.session:
            raise RuntimeError("Not connected. Call connect() first.")
        
        if not HAS_OLLAMA:
            raise RuntimeError("Ollama is not installed. Please install it with: pip install ollama")

        # Pull MCP tools and expose them to Ollama as tool schemas (with timeout)
        tools_resp = await asyncio.wait_for(self.session.list_tools(), timeout=5.0)
        ollama_tools = mcp_tools_to_ollama_tools(tools_resp.tools)

        # Build message history with system prompt
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
        ]
        
        # Add conversation history (limit to last 10 exchanges = 20 messages for efficiency)
        if conversation_history:
            # Take last 20 messages to keep context manageable for small LLMs
            recent_history = conversation_history[-20:]
            for msg in recent_history:
                # Only include user and assistant messages, skip errors
                if msg.get("role") in ["user", "assistant"]:
                    messages.append({
                        "role": msg.get("role"),
                        "content": msg.get("content", "")
                    })
        
        # Add current user prompt
        messages.append({"role": "user", "content": user_prompt})

        # Agent loop: model decides tool calls; we execute them via MCP; feed results back
        # Wrap entire loop in timeout to prevent hanging
        try:
            return await asyncio.wait_for(self._agent_loop(messages, ollama_tools), timeout=timeout)
        except asyncio.TimeoutError:
            raise RuntimeError(f"Request timed out after {timeout}s. The MCP server may be overloaded or unresponsive.")

    async def _agent_loop(self, messages: List[Dict[str, Any]], ollama_tools: List[Dict[str, Any]]) -> str:
        """Internal agent loop with timeouts on individual operations"""
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

            # Execute each tool call against AnyLog MCP (with timeout per call)
            for tc in tool_calls:
                fn = tc["function"]
                tool_name = fn["name"]
                tool_args = fn.get("arguments") or {}
                if isinstance(tool_args, str):
                    tool_args = json.loads(tool_args)

                try:
                    result = await asyncio.wait_for(
                        self.session.call_tool(tool_name, tool_args),
                        timeout=30.0  # 30s timeout per tool call
                    )
                except asyncio.TimeoutError:
                    raise RuntimeError(f"Tool call '{tool_name}' timed out after 30s. The MCP server may be overloaded.")

                # Feed tool result back to the model
                messages.append(
                    {
                        "role": "tool",
                        "tool_name": tool_name,
                        "content": json.dumps(result.model_dump() if hasattr(result, "model_dump") else result, default=str),
                    }
                )

        return "Stopped (too many tool-call iterations). Try narrowing the question."

    async def close(self, timeout: float = 5.0):
        """Close the MCP connection with timeout"""
        try:
            # Close the exit stack if it exists (with timeout)
            if self.exit_stack is not None:
                try:
                    await asyncio.wait_for(self.exit_stack.aclose(), timeout=timeout)
                except asyncio.TimeoutError:
                    # Force cleanup on timeout
                    print(f"Warning: Connection close timed out after {timeout}s, forcing cleanup")
                except RuntimeError as e:
                    # Handle "Attempted to exit cancel scope in a different task" error
                    # This happens when AsyncExitStack is closed from a different async task
                    # than where it was created. We'll just reset the state.
                    error_msg = str(e).lower()
                    if "different task" in error_msg or "cancel scope" in error_msg:
                        # Can't clean up properly from different task, just reset state
                        pass
                    else:
                        raise
                except Exception:
                    # Other errors - just reset state
                    pass
                finally:
                    self.exit_stack = None
            
            # Reset all state
            self.session = None
            self.stdio = None
            self.write = None
            self.cached_tools = []
        except Exception:
            # Ensure state is reset even if cleanup fails
            self.session = None
            self.exit_stack = None
            self.stdio = None
            self.write = None
            self.cached_tools = []

