# Plugin Management API Router
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import os

try:
    from loader import get_plugin_manager
except ImportError:
    # If relative import fails, try absolute import
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from loader import get_plugin_manager

logger = logging.getLogger(__name__)

# Create API router
api_router = APIRouter(prefix="/plugin-management", tags=["Plugin Management"])

# Pydantic models for API requests/responses
class PluginInfo(BaseModel):
    name: str
    version: str
    description: str
    author: str
    category: str
    tags: List[str]
    enabled: bool
    status: str
    loaded_at: Optional[str] = None

class PluginToggleRequest(BaseModel):
    plugin_name: str
    enabled: bool

class PluginSearchRequest(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    enabled_only: bool = False

@api_router.get("/plugins", response_model=List[PluginInfo])
async def get_all_plugins():
    """Get information about all discovered plugins"""
    try:
        plugin_manager = get_plugin_manager()
        all_plugins = plugin_manager.get_all_plugins()
        
        plugins_info = []
        
        # Process discovered plugins
        for plugin_name, manifest in all_plugins['discovered'].items():
            is_enabled = (
                plugin_name in all_plugins['config']['enabled_plugins'] or 
                (plugin_name not in all_plugins['config']['disabled_plugins'] and manifest.get('enabled', True))
            )
            
            status = "loaded" if plugin_name in all_plugins['loaded'] else "discovered"
            loaded_at = None
            if plugin_name in all_plugins['loaded']:
                loaded_at = all_plugins['loaded'][plugin_name].get('loaded_at')
            
            plugins_info.append(PluginInfo(
                name=plugin_name,
                version=manifest.get('version', '1.0.0'),
                description=manifest.get('description', ''),
                author=manifest.get('author', ''),
                category=manifest.get('category', 'utility'),
                tags=manifest.get('tags', []),
                enabled=is_enabled,
                status=status,
                loaded_at=loaded_at
            ))
        
        return plugins_info
        
    except Exception as e:
        logger.error(f"Failed to get plugins: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/plugins/{plugin_name}", response_model=PluginInfo)
async def get_plugin_info(plugin_name: str):
    """Get detailed information about a specific plugin"""
    try:
        plugin_manager = get_plugin_manager()
        plugin_info = plugin_manager.get_plugin_info(plugin_name)
        
        if not plugin_info:
            raise HTTPException(status_code=404, detail="Plugin not found")
        
        manifest = plugin_info.get('manifest', {})
        all_plugins = plugin_manager.get_all_plugins()
        
        is_enabled = (
            plugin_name in all_plugins['config']['enabled_plugins'] or 
            (plugin_name not in all_plugins['config']['disabled_plugins'] and manifest.get('enabled', True))
        )
        
        status = plugin_info.get('status', 'discovered')
        loaded_at = plugin_info.get('loaded_at')
        
        return PluginInfo(
            name=plugin_name,
            version=manifest.get('version', '1.0.0'),
            description=manifest.get('description', ''),
            author=manifest.get('author', ''),
            category=manifest.get('category', 'utility'),
            tags=manifest.get('tags', []),
            enabled=is_enabled,
            status=status,
            loaded_at=loaded_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get plugin info for {plugin_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/plugins/toggle")
async def toggle_plugin(request: PluginToggleRequest):
    """Enable or disable a plugin"""
    try:
        plugin_manager = get_plugin_manager()
        
        if request.enabled:
            success = plugin_manager.enable_plugin(request.plugin_name)
            action = "enabled"
        else:
            success = plugin_manager.disable_plugin(request.plugin_name)
            action = "disabled"
        
        if success:
            return {
                "message": f"Plugin {request.plugin_name} {action} successfully",
                "plugin_name": request.plugin_name,
                "enabled": request.enabled
            }
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to {action} plugin {request.plugin_name}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle plugin {request.plugin_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/plugins/search")
async def search_plugins(request: PluginSearchRequest):
    """Search and filter plugins"""
    try:
        plugin_manager = get_plugin_manager()
        all_plugins = plugin_manager.get_all_plugins()
        
        plugins_info = []
        
        for plugin_name, manifest in all_plugins['discovered'].items():
            # Apply filters
            if request.category and manifest.get('category') != request.category:
                continue
                
            is_enabled = (
                plugin_name in all_plugins['config']['enabled_plugins'] or 
                (plugin_name not in all_plugins['config']['disabled_plugins'] and manifest.get('enabled', True))
            )
            
            if request.enabled_only and not is_enabled:
                continue
            
            # Apply search query
            if request.query:
                query_lower = request.query.lower()
                searchable_text = f"{plugin_name} {manifest.get('description', '')} {manifest.get('author', '')} {' '.join(manifest.get('tags', []))}".lower()
                if query_lower not in searchable_text:
                    continue
            
            status = "loaded" if plugin_name in all_plugins['loaded'] else "discovered"
            loaded_at = None
            if plugin_name in all_plugins['loaded']:
                loaded_at = all_plugins['loaded'][plugin_name].get('loaded_at')
            
            plugins_info.append(PluginInfo(
                name=plugin_name,
                version=manifest.get('version', '1.0.0'),
                description=manifest.get('description', ''),
                author=manifest.get('author', ''),
                category=manifest.get('category', 'utility'),
                tags=manifest.get('tags', []),
                enabled=is_enabled,
                status=status,
                loaded_at=loaded_at
            ))
        
        return plugins_info
        
    except Exception as e:
        logger.error(f"Failed to search plugins: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/plugins/discover")
async def discover_plugins():
    """Force re-discovery of plugins"""
    try:
        plugin_manager = get_plugin_manager()
        discovered = plugin_manager.discover_plugins()
        
        return {
            "message": f"Discovered {len(discovered)} plugins",
            "plugins": list(discovered.keys())
        }
        
    except Exception as e:
        logger.error(f"Failed to discover plugins: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/config")
async def get_plugin_config():
    """Get plugin system configuration"""
    try:
        plugin_manager = get_plugin_manager()
        return plugin_manager.config
        
    except Exception as e:
        logger.error(f"Failed to get plugin config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/categories")
async def get_plugin_categories():
    """Get available plugin categories"""
    try:
        plugin_manager = get_plugin_manager()
        return plugin_manager.config.get('plugin_categories', {})
        
    except Exception as e:
        logger.error(f"Failed to get plugin categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/plugins/{plugin_name}/frontend")
async def get_plugin_frontend(plugin_name: str):
    """Get frontend component for a specific plugin"""
    try:
        plugin_manager = get_plugin_manager()
        plugin_info = plugin_manager.get_plugin_info(plugin_name)
        
        if not plugin_info:
            raise HTTPException(status_code=404, detail="Plugin not found")
        
        manifest = plugin_info.get('manifest', {})
        frontend_file = manifest.get('files', {}).get('frontend')
        
        if not frontend_file:
            raise HTTPException(status_code=404, detail="Frontend file not specified in manifest")
        
        plugin_path = os.path.join(plugin_manager.plugins_dir, plugin_name)
        frontend_path = os.path.join(plugin_path, frontend_file)
        
        if not os.path.exists(frontend_path):
            raise HTTPException(status_code=404, detail="Frontend file not found")
        
        return FileResponse(frontend_path, media_type="text/javascript")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get frontend for plugin {plugin_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
