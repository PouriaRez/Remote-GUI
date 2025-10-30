# Example Plugin Backend Router
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

# Create the API router
api_router = APIRouter(prefix="/example", tags=["Example Plugin"])

# Request/Response models
class ExampleRequest(BaseModel):
    message: str
    data: Dict[str, Any] = {}

class ExampleResponse(BaseModel):
    success: bool
    message: str
    processed_data: Dict[str, Any]
    timestamp: str

# API endpoints
@api_router.get("/")
async def example_info():
    """Get information about the example plugin"""
    return {
        "name": "Example Plugin",
        "version": "1.0.0",
        "description": "A comprehensive example plugin demonstrating the external plugin system",
        "endpoints": [
            "/example/",
            "/example/process",
            "/example/status",
            "/example/health"
        ]
    }

@api_router.post("/process", response_model=ExampleResponse)
async def process_data(request: ExampleRequest):
    """Process data using the example plugin"""
    try:
        # Simulate some processing
        processed_data = {
            "original_message": request.message,
            "data_keys": list(request.data.keys()),
            "data_count": len(request.data),
            "processed_at": "2024-01-01T00:00:00Z"
        }
        
        return ExampleResponse(
            success=True,
            message=f"Processed: {request.message}",
            processed_data=processed_data,
            timestamp="2024-01-01T00:00:00Z"
        )
        
    except Exception as e:
        logger.error(f"Error processing data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/status")
async def get_status():
    """Get plugin status"""
    return {
        "status": "active",
        "uptime": "1 hour",
        "requests_processed": 42,
        "last_request": "2024-01-01T00:00:00Z"
    }

@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "healthy": True,
        "plugin": "example_plugin",
        "version": "1.0.0"
    }

@api_router.get("/config")
async def get_config():
    """Get plugin configuration"""
    return {
        "auto_process": True,
        "max_data_size": 1000,
        "timeout": 30,
        "debug_mode": False
    }
