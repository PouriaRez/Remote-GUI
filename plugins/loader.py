# Enhanced External Plugin Loader with Manifest Support
import os
import json
import importlib
from fastapi import APIRouter
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PluginManager:
    def __init__(self, plugins_dir: str = None):
        self.plugins_dir = plugins_dir or os.path.dirname(os.path.abspath(__file__))
        self.config_file = os.path.join(self.plugins_dir, "plugin_config.json")
        self.loaded_plugins = {}
        self.plugin_manifests = {}
        self.config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load plugin configuration from file"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load plugin config: {e}")
        
        # Return default config
        return {
            "global_settings": {
                "auto_discover": True,
                "lazy_load": True,
                "max_plugins": 100,
                "plugin_timeout": 30
            },
            "enabled_plugins": [],
            "disabled_plugins": [],
            "plugin_categories": {
                "utility": "🔧",
                "data": "📊",
                "network": "🌐",
                "security": "🔒",
                "visualization": "📈",
                "integration": "🔗"
            },
            "last_scan": None,
            "version": "1.0.0"
        }
    
    def _save_config(self):
        """Save plugin configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save plugin config: {e}")
    
    def _validate_plugin_manifest(self, manifest_path: str) -> Optional[Dict[str, Any]]:
        """Validate plugin manifest and return manifest data if valid"""
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            # Required fields validation
            required_fields = [
                'name', 'version', 'description', 'author', 
                'api_prefix', 'frontend_route', 'files'
            ]
            
            for field in required_fields:
                if field not in manifest:
                    logger.error(f"Plugin manifest missing required field: {field}")
                    return None
            
            # Validate file structure
            files = manifest.get('files', {})
            plugin_dir = os.path.dirname(manifest_path)
            
            for file_type, file_path in files.items():
                full_path = os.path.join(plugin_dir, file_path)
                if not os.path.exists(full_path):
                    logger.error(f"Plugin file not found: {full_path}")
                    return None
            
            return manifest
            
        except Exception as e:
            logger.error(f"Failed to validate plugin manifest {manifest_path}: {e}")
            return None
    
    def discover_plugins(self) -> Dict[str, Dict[str, Any]]:
        """Discover all plugins in the plugins directory"""
        discovered_plugins = {}
        
        if not os.path.exists(self.plugins_dir):
            logger.warning(f"Plugins directory not found: {self.plugins_dir}")
            return discovered_plugins
        
        for item in os.listdir(self.plugins_dir):
            item_path = os.path.join(self.plugins_dir, item)
            
            # Skip if not a directory or starts with underscore
            if not os.path.isdir(item_path) or item.startswith('_'):
                continue
            
            manifest_path = os.path.join(item_path, "plugin_manifest.json")
            
            if os.path.exists(manifest_path):
                manifest = self._validate_plugin_manifest(manifest_path)
                if manifest:
                    discovered_plugins[item] = {
                        'path': item_path,
                        'manifest': manifest,
                        'status': 'discovered'
                    }
                    self.plugin_manifests[item] = manifest
                else:
                    logger.warning(f"Invalid manifest for plugin: {item}")
            else:
                logger.warning(f"No manifest found for plugin: {item}")
        
        # Update config with scan time
        self.config['last_scan'] = datetime.now().isoformat()
        self._save_config()
        
        return discovered_plugins
    
    def load_plugin(self, plugin_name: str, app=None) -> bool:
        """Load a specific plugin"""
        if plugin_name not in self.plugin_manifests:
            logger.error(f"Plugin not found: {plugin_name}")
            return False
        
        manifest = self.plugin_manifests[plugin_name]
        plugin_path = os.path.join(self.plugins_dir, plugin_name)
        
        try:
            # Load backend router
            backend_file = os.path.join(plugin_path, manifest['files']['backend'])
            if os.path.exists(backend_file):
                # Import the plugin router module
                # The backend file is in the plugins directory, so we need to import it directly
                backend_module_name = os.path.splitext(manifest["files"]["backend"])[0].replace("/", ".")
                module_name = f'{plugin_name}.{backend_module_name}'
                logger.info(f"Attempting to import module: {module_name}")
                module = importlib.import_module(module_name)
                
                if hasattr(module, 'api_router'):
                    router = module.api_router
                    logger.info(f"Found api_router in {plugin_name}: {type(router)}")
                    if isinstance(router, APIRouter):
                        # Add prefix if not already set
                        if not router.prefix:
                            router.prefix = manifest.get('api_prefix', f'/{plugin_name}')
                        
                        logger.info(f"Router prefix: {router.prefix}")
                        logger.info(f"Router routes: {[route.path for route in router.routes]}")
                        
                        if app:
                            app.include_router(router)
                            logger.info(f"✅ Successfully added {plugin_name} router to FastAPI app")
                        
                        self.loaded_plugins[plugin_name] = {
                            'router': router,
                            'manifest': manifest,
                            'status': 'loaded',
                            'loaded_at': datetime.now().isoformat()
                        }
                        
                        logger.info(f"✅ Loaded plugin: {plugin_name}")
                        return True
                    else:
                        logger.error(f"❌ {plugin_name}: api_router is not an APIRouter, got {type(router)}")
                else:
                    logger.error(f"❌ {plugin_name}: No api_router found in module {module_name}")
                    logger.error(f"Available attributes: {dir(module)}")
            else:
                logger.error(f"❌ {plugin_name}: Backend file not found")
            
        except Exception as e:
            logger.error(f"❌ Failed to load {plugin_name}: {e}")
        
        return False
    
    def unload_plugin(self, plugin_name: str) -> bool:
        """Unload a specific plugin"""
        if plugin_name in self.loaded_plugins:
            del self.loaded_plugins[plugin_name]
            logger.info(f"Unloaded plugin: {plugin_name}")
            return True
        return False
    
    def enable_plugin(self, plugin_name: str) -> bool:
        """Enable a plugin (add to enabled list)"""
        if plugin_name not in self.config['enabled_plugins']:
            self.config['enabled_plugins'].append(plugin_name)
            if plugin_name in self.config['disabled_plugins']:
                self.config['disabled_plugins'].remove(plugin_name)
            self._save_config()
            logger.info(f"Enabled plugin: {plugin_name}")
            return True
        return False
    
    def disable_plugin(self, plugin_name: str) -> bool:
        """Disable a plugin (add to disabled list)"""
        if plugin_name not in self.config['disabled_plugins']:
            self.config['disabled_plugins'].append(plugin_name)
            if plugin_name in self.config['enabled_plugins']:
                self.config['enabled_plugins'].remove(plugin_name)
            self._save_config()
            logger.info(f"Disabled plugin: {plugin_name}")
            return True
        return False
    
    def load_all_plugins(self, app) -> List[str]:
        """Load all enabled plugins"""
        # First discover all plugins
        discovered = self.discover_plugins()
        
        loaded_plugins = []
        
        for plugin_name, plugin_info in discovered.items():
            manifest = plugin_info['manifest']
            
            # Check if plugin is enabled (default to enabled if not in config)
            is_enabled = (
                plugin_name in self.config['enabled_plugins'] or 
                (plugin_name not in self.config['disabled_plugins'] and manifest.get('enabled', True))
            )
            
            if is_enabled:
                if self.load_plugin(plugin_name, app):
                    loaded_plugins.append(plugin_name)
            else:
                logger.info(f"Plugin {plugin_name} is disabled, skipping")
        
        logger.info(f"🔌 Plugin loading complete! Loaded: {loaded_plugins}")
        return loaded_plugins
    
    def get_plugin_info(self, plugin_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific plugin"""
        if plugin_name in self.loaded_plugins:
            return self.loaded_plugins[plugin_name]
        elif plugin_name in self.plugin_manifests:
            return {
                'manifest': self.plugin_manifests[plugin_name],
                'status': 'discovered'
            }
        return None
    
    def get_all_plugins(self) -> Dict[str, Any]:
        """Get information about all plugins"""
        return {
            'loaded': self.loaded_plugins,
            'discovered': self.plugin_manifests,
            'config': self.config
        }

# Global plugin manager instance
plugin_manager = PluginManager()

def load_plugins(app):
    """
    Enhanced plugin loader that:
    1. Discovers plugins in the plugins directory
    2. Validates plugin manifests
    3. Loads only enabled plugins
    4. Handles errors gracefully
    """
    return plugin_manager.load_all_plugins(app)

def get_plugin_manager():
    """Get the global plugin manager instance"""
    return plugin_manager
