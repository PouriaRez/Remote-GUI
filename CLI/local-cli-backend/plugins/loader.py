# Enhanced Plugin Loader with Folder Support
import os
import importlib
from fastapi import APIRouter
from typing import Dict, List

def load_plugins(app):
    """
    Enhanced plugin loader that:
    1. Scans the plugins directory for folders
    2. Looks for <plugin_name>_router.py files in each folder
    3. Loads the api_router from those files
    4. Adds those routers to the main FastAPI app
    """
    plugins_dir = os.path.dirname(os.path.abspath(__file__))
    loaded_plugins = []
    
    print("🔌 Loading plugins...")
    
    # Scan for plugin folders in plugins directory
    for item in os.listdir(plugins_dir):
        item_path = os.path.join(plugins_dir, item)
        
        # Skip if not a directory or starts with underscore
        if not os.path.isdir(item_path) or item.startswith('_'):
            continue
            
        plugin_name = item
        router_file = f"{plugin_name}_router.py"
        router_path = os.path.join(item_path, router_file)
        
        # Check if the router file exists
        if os.path.exists(router_path):
            try:
                # Import the plugin router module
                module_name = f'plugins.{plugin_name}.{plugin_name}_router'
                module = importlib.import_module(module_name)
                
                # Check if it has an api_router
                if hasattr(module, 'api_router'):
                    router = module.api_router
                    if isinstance(router, APIRouter):
                        # Add the router to the main app
                        app.include_router(router)
                        loaded_plugins.append(plugin_name)
                        print(f"✅ Loaded plugin: {plugin_name}")
                    else:
                        print(f"❌ {plugin_name}: api_router is not an APIRouter")
                else:
                    print(f"❌ {plugin_name}: No api_router found in {router_file}")
                    
            except Exception as e:
                print(f"❌ Failed to load {plugin_name}: {e}")
        else:
            print(f"⚠️  {plugin_name}: No {router_file} found")
    
    print(f"🔌 Plugin loading complete! Loaded: {loaded_plugins}")
    return loaded_plugins
