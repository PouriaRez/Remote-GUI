# UNS Plugin - Unified Namespace
# Provides filesystem-like interface for blockchain metadata

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from plugins.utils import make_request, parse_response

# Create the API router
api_router = APIRouter(prefix="/uns", tags=["UNS"])

# Request models
class BlockchainQueryRequest(BaseModel):
    conn: str
    item_id: Optional[str] = None
    include_children: bool = False

class GetRootRequest(BaseModel):
    conn: str

# API endpoints
@api_router.get("/")
async def uns_info():
    """Get UNS plugin information"""
    return {
        "name": "Unified Namespace Plugin",
        "version": "1.0.0",
        "description": "Filesystem-like interface for blockchain metadata"
    }

@api_router.post("/get-root")
async def get_root(request: GetRootRequest):
    """Get root items from blockchain (blockchain get *)"""
    try:
        command = "blockchain get *"
        print(f"UNS: Executing command: {command}")
        print(f"UNS: Connection: {request.conn}")
        response = make_request(request.conn, "GET", command)
        parsed = parse_response(response)
        
        # Extract data from response
        if isinstance(parsed, dict) and "data" in parsed:
            data = parsed["data"]
        elif isinstance(parsed, list):
            data = parsed
        else:
            data = parsed
        
        # Ensure data is a list
        if not isinstance(data, list):
            data = [data] if data else []
        
        # Log first item structure for debugging
        if data and len(data) > 0:
            print(f"UNS: First root item structure: {data[0]}")
        
        return {
            "success": True,
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get root items: {str(e)}")

@api_router.post("/get-item")
async def get_item(request: BlockchainQueryRequest):
    """Get a specific item by ID"""
    try:
        if not request.item_id:
            raise HTTPException(status_code=400, detail="item_id is required")
        
        command = f'blockchain get * where [id] = "{request.item_id}"'
        print(f"UNS: Executing command: {command}")
        print(f"UNS: Connection: {request.conn}")
        print(f"UNS: Item ID: {request.item_id}")
        response = make_request(request.conn, "GET", command)
        parsed = parse_response(response)
        
        # Extract data from response
        if isinstance(parsed, dict) and "data" in parsed:
            data = parsed["data"]
        elif isinstance(parsed, list):
            data = parsed
        else:
            data = parsed
        
        return {
            "success": True,
            "data": data if isinstance(data, list) else [data] if data else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get item: {str(e)}")

@api_router.post("/get-children")
async def get_children(request: BlockchainQueryRequest):
    """Get children of a specific item"""
    try:
        if not request.item_id:
            raise HTTPException(status_code=400, detail="item_id is required")
        
        command = f'blockchain get * where [id] = "{request.item_id}" bring.children'
        print(f"UNS: Executing command: {command}")
        print(f"UNS: Connection: {request.conn}")
        print(f"UNS: Item ID: {request.item_id}")
        response = make_request(request.conn, "GET", command)
        parsed = parse_response(response)
        print(f"UNS: Response received, parsed type: {type(parsed)}")
        
        # Extract data from response
        if isinstance(parsed, dict) and "data" in parsed:
            data = parsed["data"]
        elif isinstance(parsed, list):
            data = parsed
        else:
            data = parsed
        
        return {
            "success": True,
            "data": data if isinstance(data, list) else [data] if data else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get children: {str(e)}")

