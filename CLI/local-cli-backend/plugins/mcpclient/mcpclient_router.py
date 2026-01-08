"""
MCP Client Plugin Router
Integrates Ollama with AnyLog MCP for AI-powered maintenance copilot
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List, Dict, Dict
import os
import asyncio

# Create the API router
api_router = APIRouter(prefix="/mcpclient", tags=["MCP Client"])

# Try to import MCP agent
HAS_MCP_AGENT = False
try:
    from .mcp_agent import AnyLogMCPAgent, HAS_OLLAMA, HAS_MCP, DEFAULT_ANYLOG_MCP_SSE_URL, DEFAULT_OLLAMA_MODEL
    HAS_MCP_AGENT = True
    print("✅ Successfully imported MCP agent")
except ImportError as e:
    print(f"⚠️  Could not import MCP agent: {e}")
    print("   This usually means missing dependencies: ollama, mcp")
    # Create dummy class for error handling
    class AnyLogMCPAgent:
        def __init__(self, *args, **kwargs):
            raise RuntimeError("MCP agent not available - missing dependencies")

# Request/Response models
class MCPConnectRequest(BaseModel):
    anylog_sse_url: Optional[str] = None
    ollama_model: Optional[str] = None

class MCPAskRequest(BaseModel):
    prompt: str
    anylog_sse_url: Optional[str] = None
    ollama_model: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None  # List of {role: "user"|"assistant", content: "..."}

class MCPStatusResponse(BaseModel):
    connected: bool
    available_tools: List[str]
    ollama_available: bool
    mcp_available: bool
    current_model: Optional[str] = None
    anylog_url: Optional[str] = None

# Global agent instance (per-request would be better, but for simplicity we'll use one)
_agent_instance: Optional[AnyLogMCPAgent] = None
_agent_lock = asyncio.Lock()
_connecting = False  # Flag to prevent concurrent connection attempts

async def get_or_create_agent(anylog_sse_url: Optional[str] = None, ollama_model: Optional[str] = None) -> AnyLogMCPAgent:
    """Get or create a global agent instance with connection reuse"""
    global _agent_instance, _connecting
    
    async with _agent_lock:
        url = anylog_sse_url or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
        model = ollama_model or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
        
        # Reuse existing connection if URL and model match
        if _agent_instance is not None:
            if (_agent_instance.anylog_sse_url == url and 
                _agent_instance.ollama_model == model and
                _agent_instance.session is not None):
                # Verify it's still alive
                if await _agent_instance.health_check():
                    return _agent_instance
                else:
                    # Connection is dead, clean it up
                    try:
                        await asyncio.wait_for(_agent_instance.close(), timeout=5.0)
                    except Exception:
                        pass
                    _agent_instance = None
        
        # Prevent concurrent connection attempts
        if _connecting:
            raise RuntimeError("Another connection attempt is in progress. Please wait.")
        
        _connecting = True
        try:
            _agent_instance = AnyLogMCPAgent(anylog_sse_url=url, ollama_model=model)
            await _agent_instance.connect(timeout=10.0)
            return _agent_instance
        finally:
            _connecting = False

async def close_agent(timeout: float = 5.0):
    """Close the global agent instance with timeout"""
    global _agent_instance, _connecting
    async with _agent_lock:
        if _agent_instance is not None:
            try:
                await asyncio.wait_for(_agent_instance.close(), timeout=timeout)
            except asyncio.TimeoutError:
                # Force cleanup on timeout
                print("Warning: Connection close timed out, forcing cleanup")
                _agent_instance.session = None
                _agent_instance.stdio = None
                _agent_instance.write = None
                _agent_instance.exit_stack = None
                _agent_instance.cached_tools = []
            except Exception as e:
                print(f"Error closing agent: {e}")
            finally:
                _agent_instance = None
                _connecting = False

# API endpoints
@api_router.get("/")
async def mcpclient_info():
    """Get MCP client information"""
    return {
        "name": "MCP Client Plugin",
        "version": "1.0.0",
        "description": "Integrates Ollama with AnyLog MCP for AI-powered maintenance copilot",
        "ollama_available": HAS_OLLAMA,
        "mcp_available": HAS_MCP,
        "dependencies": {
            "ollama": HAS_OLLAMA,
            "mcp": HAS_MCP
        },
        "endpoints": [
            "/status - Get connection status",
            "/connect - Connect to AnyLog MCP",
            "/disconnect - Disconnect from AnyLog MCP",
            "/ask - Ask a question to the MCP agent",
            "/tools - List available MCP tools"
        ]
    }

@api_router.get("/status")
async def get_status():
    """Get MCP client connection status (verifies connection is actually working)"""
    global _agent_instance
    
    if not HAS_MCP_AGENT:
        return MCPStatusResponse(
            connected=False,
            available_tools=[],
            ollama_available=HAS_OLLAMA,
            mcp_available=HAS_MCP,
            current_model=None,
            anylog_url=None
        )
    
    if _agent_instance is None or _agent_instance.session is None:
        return MCPStatusResponse(
            connected=False,
            available_tools=[],
            ollama_available=HAS_OLLAMA,
            mcp_available=HAS_MCP,
            current_model=_agent_instance.ollama_model if _agent_instance else None,
            anylog_url=_agent_instance.anylog_sse_url if _agent_instance else None
        )
    
    # Verify connection is actually working with a health check
    is_alive = await _agent_instance.health_check()
    
    if not is_alive:
        # Connection is dead, clean up
        try:
            await close_agent()
        except Exception:
            pass
        return MCPStatusResponse(
            connected=False,
            available_tools=[],
            ollama_available=HAS_OLLAMA,
            mcp_available=HAS_MCP,
            current_model=_agent_instance.ollama_model if _agent_instance else None,
            anylog_url=_agent_instance.anylog_sse_url if _agent_instance else None
        )
    
    # Connection is alive, use cached tools
    return MCPStatusResponse(
        connected=True,
        available_tools=_agent_instance.cached_tools,
        ollama_available=HAS_OLLAMA,
        mcp_available=HAS_MCP,
        current_model=_agent_instance.ollama_model,
        anylog_url=_agent_instance.anylog_sse_url
    )

@api_router.post("/connect")
async def connect_mcp(request: MCPConnectRequest):
    """Connect to AnyLog MCP server with connection reuse"""
    if not HAS_MCP_AGENT:
        raise HTTPException(
            status_code=500,
            detail="MCP agent not available. Please install required dependencies: ollama, mcp"
        )
    
    try:
        global _agent_instance
        
        url = request.anylog_sse_url or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
        model = request.ollama_model or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
        
        # Check if we can reuse existing connection
        async with _agent_lock:
            if (_agent_instance is not None and 
                _agent_instance.anylog_sse_url == url and 
                _agent_instance.ollama_model == model and
                _agent_instance.session is not None):
                # Verify it's still alive
                if await _agent_instance.health_check():
                    return {
                        "success": True,
                        "message": "Reusing existing connection to AnyLog MCP",
                        "available_tools": _agent_instance.cached_tools,
                        "ollama_model": model,
                        "anylog_url": url
                    }
                else:
                    # Connection is dead, clean it up
                    try:
                        await asyncio.wait_for(_agent_instance.close(), timeout=5.0)
                    except Exception:
                        pass
                    _agent_instance = None
        
        # Close existing connection if URL/model changed
        if _agent_instance is not None:
            if (_agent_instance.anylog_sse_url != url or 
                _agent_instance.ollama_model != model):
                await close_agent()
        
        # Create new connection (or reuse if same URL/model)
        agent = await get_or_create_agent(url, model)
        tools = agent.cached_tools
        
        return {
            "success": True,
            "message": "Connected to AnyLog MCP",
            "available_tools": tools,
            "ollama_model": model,
            "anylog_url": url
        }
    except Exception as e:
        import traceback
        error_detail = str(e)
        # Add more context for common errors
        if "mcp-proxy" in error_detail.lower() or "command not found" in error_detail.lower():
            error_detail = f"mcp-proxy not found. Please ensure mcp-proxy is installed and in your PATH. Original error: {error_detail}"
        elif "connection" in error_detail.lower() and "closed" in error_detail.lower():
            error_detail = f"Connection to AnyLog MCP server failed. Please check if the server is running at {url}. Original error: {error_detail}"
        elif "ConnectionError" in str(type(e)):
            error_detail = f"Cannot reach AnyLog MCP server at {url}. Please verify the URL and that the server is accessible. Original error: {error_detail}"
        
        print(f"❌ MCP Connection Error: {error_detail}")
        print(f"   Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)

@api_router.post("/disconnect")
async def disconnect_mcp():
    """Disconnect from AnyLog MCP server"""
    try:
        await close_agent()
        return {
            "success": True,
            "message": "Disconnected from AnyLog MCP"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect: {str(e)}")

@api_router.get("/tools")
async def list_tools():
    """List available MCP tools"""
    global _agent_instance
    
    if not HAS_MCP_AGENT:
        raise HTTPException(
            status_code=500,
            detail="MCP agent not available. Please install required dependencies: ollama, mcp"
        )
    
    if _agent_instance is None or _agent_instance.session is None:
        raise HTTPException(
            status_code=400,
            detail="Not connected. Please call /connect first."
        )
    
    try:
        # Use cached tools if available, otherwise fetch fresh (with timeout)
        if _agent_instance.cached_tools:
            # We have cached tool names, but need full details - fetch once with timeout
            tools_resp = await asyncio.wait_for(_agent_instance.session.list_tools(), timeout=5.0)
            tools = []
            for t in tools_resp.tools:
                tools.append({
                    "name": t.name,
                    "description": t.description or "",
                    "inputSchema": t.inputSchema or {}
                })
            return {
                "success": True,
                "tools": tools,
                "count": len(tools)
            }
        else:
            # No cached tools, fetch fresh with timeout
            tools_resp = await asyncio.wait_for(_agent_instance.session.list_tools(), timeout=5.0)
            tools = []
            for t in tools_resp.tools:
                tools.append({
                    "name": t.name,
                    "description": t.description or "",
                    "inputSchema": t.inputSchema or {}
                })
            # Update cache
            _agent_instance.cached_tools = [t.name for t in tools_resp.tools]
            return {
                "success": True,
                "tools": tools,
                "count": len(tools)
            }
    except asyncio.TimeoutError:
        raise HTTPException(status_code=500, detail="Failed to list tools: Operation timed out after 5s")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list tools: {str(e)}")

@api_router.post("/ask")
async def ask_question(request: MCPAskRequest):
    """Ask a question to the MCP agent"""
    if not HAS_MCP_AGENT:
        raise HTTPException(
            status_code=500,
            detail="MCP agent not available. Please install required dependencies: ollama, mcp"
        )
    
    try:
        global _agent_instance
        
        # Get or create connection (with reuse logic)
        url = request.anylog_sse_url or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
        model = request.ollama_model or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
        agent = await get_or_create_agent(url, model)
        
        # Ask the question (with timeout and conversation history)
        print(f"📝 MCP Ask Request - Prompt: {request.prompt[:100]}...")
        print(f"📝 Conversation history length: {len(request.conversation_history) if request.conversation_history else 0}")
        
        answer = await agent.ask(
            request.prompt, 
            conversation_history=request.conversation_history,
            timeout=120.0
        )
        
        print(f"✅ MCP Ask Response - Answer length: {len(answer) if answer else 0}")
        print(f"✅ MCP Ask Response - Answer preview: {answer[:200] if answer else 'None'}...")
        
        response = {
            "success": True,
            "answer": answer,
            "prompt": request.prompt
        }
        
        print(f"✅ Returning response with answer field: {bool(response.get('answer'))}")
        return response
    except Exception as e:
        # If connection error, mark as disconnected
        error_str = str(e).lower()
        if "connection" in error_str or "closed" in error_str or "not connected" in error_str:
            try:
                await close_agent()
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to process question: {str(e)}")

@api_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for streaming chat"""
    await websocket.accept()
    
    if not HAS_MCP_AGENT:
        await websocket.send_json({
            "type": "error",
            "message": "MCP agent not available. Please install required dependencies: ollama, mcp"
        })
        await websocket.close()
        return
    
    agent = None
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data.get("type") == "connect":
                # Connect to MCP
                url = data.get("anylog_sse_url") or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
                model = data.get("ollama_model") or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
                
                agent = AnyLogMCPAgent(anylog_sse_url=url, ollama_model=model)
                tools = await agent.connect()
                
                await websocket.send_json({
                    "type": "connected",
                    "tools": tools,
                    "model": model,
                    "url": url
                })
            
            elif data.get("type") == "ask":
                if agent is None or agent.session is None:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Not connected. Send 'connect' message first."
                    })
                    continue
                
                prompt = data.get("prompt", "")
                if not prompt:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Prompt is required"
                    })
                    continue
                
                # Ask the question
                answer = await agent.ask(prompt)
                
                await websocket.send_json({
                    "type": "answer",
                    "answer": answer,
                    "prompt": prompt
                })
            
            elif data.get("type") == "disconnect":
                if agent:
                    await agent.close()
                    agent = None
                await websocket.send_json({
                    "type": "disconnected"
                })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {data.get('type')}"
                })
    
    except WebSocketDisconnect:
        if agent:
            await agent.close()
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })
        if agent:
            await agent.close()

