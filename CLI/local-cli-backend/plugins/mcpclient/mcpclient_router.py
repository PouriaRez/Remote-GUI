"""
MCP Client Plugin Router
Integrates Ollama with AnyLog MCP for AI-powered maintenance copilot
"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
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

async def get_or_create_agent(anylog_sse_url: Optional[str] = None, ollama_model: Optional[str] = None) -> AnyLogMCPAgent:
    """Get or create a global agent instance"""
    global _agent_instance
    
    async with _agent_lock:
        if _agent_instance is None:
            url = anylog_sse_url or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
            model = ollama_model or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
            _agent_instance = AnyLogMCPAgent(anylog_sse_url=url, ollama_model=model)
            await _agent_instance.connect()
        return _agent_instance

async def close_agent():
    """Close the global agent instance"""
    global _agent_instance
    async with _agent_lock:
        if _agent_instance is not None:
            await _agent_instance.close()
            _agent_instance = None

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
    """Get MCP client connection status"""
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
    
    try:
        tools_resp = await _agent_instance.session.list_tools()
        tools = [t.name for t in tools_resp.tools]
        return MCPStatusResponse(
            connected=True,
            available_tools=tools,
            ollama_available=HAS_OLLAMA,
            mcp_available=HAS_MCP,
            current_model=_agent_instance.ollama_model,
            anylog_url=_agent_instance.anylog_sse_url
        )
    except Exception:
        return MCPStatusResponse(
            connected=False,
            available_tools=[],
            ollama_available=HAS_OLLAMA,
            mcp_available=HAS_MCP,
            current_model=_agent_instance.ollama_model if _agent_instance else None,
            anylog_url=_agent_instance.anylog_sse_url if _agent_instance else None
        )

@api_router.post("/connect")
async def connect_mcp(request: MCPConnectRequest):
    """Connect to AnyLog MCP server"""
    if not HAS_MCP_AGENT:
        raise HTTPException(
            status_code=500,
            detail="MCP agent not available. Please install required dependencies: ollama, mcp"
        )
    
    try:
        global _agent_instance
        
        # Close existing connection if any
        await close_agent()
        
        # Create new connection
        url = request.anylog_sse_url or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
        model = request.ollama_model or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
        
        _agent_instance = AnyLogMCPAgent(anylog_sse_url=url, ollama_model=model)
        tools = await _agent_instance.connect()
        
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
        tools_resp = await _agent_instance.session.list_tools()
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
        
        # If not connected, connect first
        if _agent_instance is None or _agent_instance.session is None:
            url = request.anylog_sse_url or os.getenv("ANYLOG_MCP_SSE_URL", DEFAULT_ANYLOG_MCP_SSE_URL)
            model = request.ollama_model or os.getenv("OLLAMA_MODEL", DEFAULT_OLLAMA_MODEL)
            _agent_instance = AnyLogMCPAgent(anylog_sse_url=url, ollama_model=model)
            await _agent_instance.connect()
        
        # Ask the question
        answer = await _agent_instance.ask(request.prompt)
        
        return {
            "success": True,
            "answer": answer,
            "prompt": request.prompt
        }
    except Exception as e:
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

