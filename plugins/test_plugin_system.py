#!/usr/bin/env python3
"""
Test script for the external plugin system
"""

import os
import sys
import json

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_plugin_discovery():
    """Test plugin discovery functionality"""
    print("🔍 Testing Plugin Discovery...")
    
    try:
        from plugins.loader import PluginManager
        
        # Create plugin manager
        plugin_manager = PluginManager()
        
        # Discover plugins
        discovered = plugin_manager.discover_plugins()
        
        print(f"✅ Discovered {len(discovered)} plugins:")
        for plugin_name, plugin_info in discovered.items():
            manifest = plugin_info['manifest']
            print(f"  - {plugin_name}: {manifest.get('description', 'No description')}")
            print(f"    Version: {manifest.get('version', 'Unknown')}")
            print(f"    Author: {manifest.get('author', 'Unknown')}")
            print(f"    Category: {manifest.get('category', 'Unknown')}")
            print(f"    Enabled: {manifest.get('enabled', False)}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Plugin discovery failed: {e}")
        return False

def test_plugin_validation():
    """Test plugin manifest validation"""
    print("🔍 Testing Plugin Validation...")
    
    try:
        from plugins.loader import PluginManager
        
        plugin_manager = PluginManager()
        
        # Test example plugin manifest
        example_manifest_path = os.path.join(plugin_manager.plugins_dir, "example_plugin", "plugin_manifest.json")
        
        if os.path.exists(example_manifest_path):
            manifest = plugin_manager._validate_plugin_manifest(example_manifest_path)
            if manifest:
                print("✅ Example plugin manifest is valid")
                print(f"  - Name: {manifest.get('name')}")
                print(f"  - Version: {manifest.get('version')}")
                print(f"  - API Prefix: {manifest.get('api_prefix')}")
                return True
            else:
                print("❌ Example plugin manifest is invalid")
                return False
        else:
            print("⚠️  Example plugin manifest not found")
            return False
            
    except Exception as e:
        print(f"❌ Plugin validation failed: {e}")
        return False

def test_config_management():
    """Test configuration management"""
    print("🔍 Testing Configuration Management...")
    
    try:
        from plugins.loader import PluginManager
        
        plugin_manager = PluginManager()
        
        # Test config loading
        config = plugin_manager.config
        print(f"✅ Configuration loaded successfully")
        print(f"  - Auto discover: {config['global_settings']['auto_discover']}")
        print(f"  - Lazy load: {config['global_settings']['lazy_load']}")
        print(f"  - Max plugins: {config['global_settings']['max_plugins']}")
        print(f"  - Categories: {len(config['plugin_categories'])}")
        
        # Test plugin enable/disable
        test_plugin = "example_plugin"
        if test_plugin in plugin_manager.plugin_manifests:
            print(f"✅ Testing enable/disable for {test_plugin}")
            
            # Enable plugin
            plugin_manager.enable_plugin(test_plugin)
            print(f"  - Enabled {test_plugin}")
            
            # Disable plugin
            plugin_manager.disable_plugin(test_plugin)
            print(f"  - Disabled {test_plugin}")
            
            return True
        else:
            print(f"⚠️  Test plugin {test_plugin} not found")
            return False
            
    except Exception as e:
        print(f"❌ Configuration management failed: {e}")
        return False

def test_file_structure():
    """Test plugin file structure"""
    print("🔍 Testing Plugin File Structure...")
    
    try:
        plugins_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Check for example plugin
        example_plugin_dir = os.path.join(plugins_dir, "example_plugin")
        
        if os.path.exists(example_plugin_dir):
            print("✅ Example plugin directory exists")
            
            # Check required files
            required_files = [
                "plugin_manifest.json",
                "backend/plugin_router.py",
                "frontend/ExamplePage.js"
            ]
            
            for file_path in required_files:
                full_path = os.path.join(example_plugin_dir, file_path)
                if os.path.exists(full_path):
                    print(f"  ✅ {file_path} exists")
                else:
                    print(f"  ❌ {file_path} missing")
                    return False
            
            return True
        else:
            print("❌ Example plugin directory not found")
            return False
            
    except Exception as e:
        print(f"❌ File structure test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Plugin System Tests\n")
    
    tests = [
        test_file_structure,
        test_plugin_validation,
        test_plugin_discovery,
        test_config_management
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Plugin system is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the output above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
