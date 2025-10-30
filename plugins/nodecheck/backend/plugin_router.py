# Nodecheck Plugin - Migrated to External Plugin System
# Node health monitoring and status checking

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import sys
import os

# Import utils from the plugins directory
from utils import make_request, monitor_network as utils_monitor_network

# Create the API router
api_router = APIRouter(prefix="/nodecheck", tags=["Node Check"])

# Request/Response models
class NodeRequest(BaseModel):
    connection: str

# Node check functions
def get_status(connection: str) -> Dict[str, Any]:
    """Get comprehensive status information from the node."""
    try:
        status_data = {}
        
        # Get system status
        try:
            status_data["status"] = make_request(connection, "GET", "get status")
        except Exception as e:
            status_data["status"] = f"Error: {str(e)}"
        
        return {
            "success": True,
            "data": status_data,
            "message": "Status information retrieved successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get status: {str(e)}"
        }

def get_processes(connection: str) -> Dict[str, Any]:
    """Get information about running processes on the node."""
    try:
        processes_data = make_request(connection, "GET", "get processes where format=json")
        
        return {
            "success": True,
            "data": processes_data,
            "message": "Process information retrieved successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get processes: {str(e)}"
        }

def get_connections(connection: str) -> Dict[str, Any]:
    """Get network connection information from the node."""
    try:
        connections_data = make_request(connection, "GET", "get connections where format=json")
        
        return {
            "success": True,
            "data": connections_data,
            "message": "Connection information retrieved successfully"
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get connections: {str(e)}"
        }

def run_all_checks(connection: str) -> Dict[str, Any]:
    """Run all available checks and return comprehensive results."""
    try:
        all_results = {}
        
        # Run status check
        status_result = get_status(connection)
        all_results["status"] = status_result
        
        # Run processes check
        processes_result = get_processes(connection)
        all_results["processes"] = processes_result
        
        # Run connections check
        connections_result = get_connections(connection)
        all_results["connections"] = connections_result
        
        # Count successful checks
        successful_checks = sum(1 for result in all_results.values() if result.get("success", False))
        total_checks = len(all_results)
        
        return {
            "success": True,
            "data": all_results,
            "summary": {
                "total_checks": total_checks,
                "successful_checks": successful_checks,
                "failed_checks": total_checks - successful_checks
            },
            "message": f"All checks completed. {successful_checks}/{total_checks} checks successful."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to run all checks: {str(e)}"
        }

# API endpoints
@api_router.get("/")
async def nodecheck_info():
    """Get nodecheck information"""
    return {
        "name": "Node Check Plugin",
        "version": "1.0.0",
        "description": "Check the status and health of nodes in the network",
        "endpoints": [
            "/status - Get comprehensive node status",
            "/processes - Get running processes",
            "/connections - Get network connections",
            "/run-all-checks - Run all checks"
        ]
    }

@api_router.post("/status")
async def get_node_status(request: NodeRequest):
    """Get comprehensive node status"""
    try:
        result = get_status(request.connection)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get node status: {str(e)}")

@api_router.post("/processes")
async def get_processes_endpoint(request: NodeRequest):
    """Get running processes information"""
    try:
        result = get_processes(request.connection)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get processes: {str(e)}")

@api_router.post("/connections")
async def get_connections_endpoint(request: NodeRequest):
    """Get network connections information"""
    try:
        result = get_connections(request.connection)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get connections: {str(e)}")

@api_router.post("/run-all-checks")
async def run_all_checks_endpoint(request: NodeRequest):
    """Run all available checks and return comprehensive results"""
    try:
        result = run_all_checks(request.connection)
        if result["success"]:
            return result
        else:
            raise HTTPException(status_code=500, detail=result["error"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run all checks: {str(e)}")
