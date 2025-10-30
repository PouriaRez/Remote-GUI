# External Plugin System

A comprehensive, scalable external plugin system for the Remote GUI application that supports both internal and external plugins with full lifecycle management, configuration, and UI integration.

## 🚀 Features

- **Plugin Discovery**: Automatic discovery of plugins in the `/plugins` directory
- **Manifest Validation**: Comprehensive validation of plugin structure and requirements
- **Enable/Disable**: Dynamic plugin management with persistent configuration
- **Plugin Management UI**: Full-featured web interface for managing plugins
- **Search & Filter**: Advanced search and filtering capabilities
- **Lazy Loading**: Performance-optimized loading for hundreds of plugins
- **Error Handling**: Graceful error handling and fallback mechanisms
- **API Integration**: RESTful API for plugin management
- **Frontend Integration**: Automatic routing and sidebar integration

## 📁 Plugin Structure

### Standard Plugin Format
```
/plugins/
├── plugin_name/
│   ├── plugin_manifest.json    # Required metadata and configuration
│   ├── backend/
│   │   └── plugin_router.py    # FastAPI router with api_router export
│   ├── frontend/
│   │   └── PluginNamePage.js   # React component (PascalCase)
│   └── assets/                 # Optional static files
```

### Plugin Manifest (`plugin_manifest.json`)
```json
{
  "name": "plugin_name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Plugin Developer",
  "category": "utility",
  "tags": ["example", "demo"],
  "dependencies": [],
  "requirements": {
    "python": ">=3.8",
    "fastapi": ">=0.68.0"
  },
  "api_prefix": "/plugin_name",
  "frontend_route": "plugin_name",
  "enabled": true,
  "files": {
    "backend": "backend/plugin_router.py",
    "frontend": "frontend/PluginNamePage.js",
    "manifest": "plugin_manifest.json"
  },
  "permissions": {
    "read": true,
    "write": false,
    "network": false
  },
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## 🔧 Backend Plugin Development

### 1. Create Plugin Directory
```bash
mkdir /plugins/my_plugin
mkdir /plugins/my_plugin/backend
mkdir /plugins/my_plugin/frontend
```

### 2. Create Plugin Manifest
Create `/plugins/my_plugin/plugin_manifest.json` with required fields.

### 3. Create Backend Router
Create `/plugins/my_plugin/backend/plugin_router.py`:

```python
from fastapi import APIRouter
from pydantic import BaseModel

# Create the API router
api_router = APIRouter(prefix="/my_plugin", tags=["My Plugin"])

# Request/Response models
class MyRequest(BaseModel):
    message: str
    data: dict = {}

class MyResponse(BaseModel):
    success: bool
    result: str

# API endpoints
@api_router.get("/")
async def plugin_info():
    return {"name": "My Plugin", "version": "1.0.0"}

@api_router.post("/process", response_model=MyResponse)
async def process_data(request: MyRequest):
    return MyResponse(
        success=True,
        result=f"Processed: {request.message}"
    )
```

### 4. Create Frontend Component
Create `/plugins/my_plugin/frontend/MyPluginPage.js`:

```javascript
import React, { useState } from 'react';

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

const MyPluginPage = ({ node }) => {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_URL}/my_plugin/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, data: {} })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Plugin</h1>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message"
      />
      <button onClick={handleSubmit}>Process</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default MyPluginPage;
```

## 🎛️ Plugin Management

### Web Interface
Access the Plugin Management interface at `/dashboard/plugins` to:
- View all discovered plugins
- Enable/disable plugins
- Search and filter plugins
- View plugin metadata and status
- Force plugin discovery

### API Endpoints

#### Get All Plugins
```http
GET /plugin-management/plugins
```

#### Get Plugin Info
```http
GET /plugin-management/plugins/{plugin_name}
```

#### Toggle Plugin
```http
POST /plugin-management/plugins/toggle
Content-Type: application/json

{
  "plugin_name": "my_plugin",
  "enabled": true
}
```

#### Search Plugins
```http
POST /plugin-management/search
Content-Type: application/json

{
  "query": "search term",
  "category": "utility",
  "enabled_only": true
}
```

#### Discover Plugins
```http
POST /plugin-management/discover
```

## ⚙️ Configuration

### Global Configuration (`/plugins/plugin_config.json`)
```json
{
  "global_settings": {
    "auto_discover": true,
    "lazy_load": true,
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
  "last_scan": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

## 🔍 Plugin Discovery Process

1. **Scan Directory**: System scans `/plugins` directory for plugin folders
2. **Validate Manifest**: Each plugin's `plugin_manifest.json` is validated
3. **Check Files**: Required backend and frontend files are verified
4. **Load Configuration**: Plugin enable/disable state is checked
5. **Register Routes**: Enabled plugins are registered with FastAPI
6. **Update UI**: Frontend is updated with new plugin routes

## 🚀 Performance Features

### Lazy Loading
- Plugin components are loaded only when accessed
- Backend routers are loaded on-demand
- Reduces initial application startup time

### Caching
- Plugin manifests are cached after discovery
- Configuration is persisted across restarts
- Frontend components are cached after first load

### Error Boundaries
- Failed plugins don't crash the application
- Graceful fallback components for missing plugins
- Comprehensive error logging

## 🔒 Security Features

### Manifest Validation
- Required fields validation
- File structure verification
- JSON schema validation

### Permission System
- Plugin permissions defined in manifest
- Read/write/network access controls
- Future: Sandboxing capabilities

### Error Isolation
- Plugin errors don't affect other plugins
- Graceful degradation on failures
- Comprehensive error reporting

## 📊 Monitoring & Debugging

### Plugin Status
- Loaded/Enabled/Disabled states
- Load timestamps
- Error counts and types

### Logging
- Comprehensive plugin loading logs
- Error tracking and reporting
- Performance metrics

### Health Checks
- Plugin health endpoints
- System status monitoring
- Automatic recovery mechanisms

## 🔄 Plugin Lifecycle

1. **Discovery**: Plugin is found and manifest validated
2. **Registration**: Plugin is registered in the system
3. **Loading**: Backend router and frontend component loaded
4. **Activation**: Plugin becomes available to users
5. **Runtime**: Plugin serves requests and updates
6. **Deactivation**: Plugin is disabled or removed
7. **Cleanup**: Resources are freed and routes removed

## 🛠️ Development Tools

### Plugin Template
Use the included `example_plugin` as a template for new plugins.

### Validation Scripts
```bash
# Validate plugin structure
python -m plugins.validator /plugins/my_plugin

# Check plugin dependencies
python -m plugins.dependency_checker /plugins/my_plugin
```

### Development Mode
```bash
# Enable development mode for hot reloading
export PLUGIN_DEV_MODE=true
uvicorn CLI.local-cli-backend.main:app --reload
```

## 📈 Scalability Considerations

### For Hundreds of Plugins
- Lazy loading reduces memory usage
- Plugin categorization improves organization
- Search and filtering enable quick discovery
- Pagination in management UI
- Plugin dependencies and conflicts resolution

### Performance Optimization
- Plugin loading is asynchronous
- Frontend components are code-split
- Backend routes are isolated with prefixes
- Caching reduces repeated operations

## 🎯 Future Enhancements

### Planned Features
- Plugin marketplace integration
- Git-based plugin installation
- Plugin versioning and updates
- User-specific plugin preferences
- Plugin analytics and monitoring
- Advanced permission system
- Plugin dependency management
- Hot-swapping of plugins

### Extension Points
- Custom plugin categories
- Plugin-specific configuration UIs
- Plugin communication APIs
- Plugin event system
- Plugin data persistence
- Plugin testing framework

## 📚 Examples

### Calculator Plugin
A simple calculator plugin demonstrating basic functionality.

### Node Check Plugin
A network monitoring plugin showing advanced features.

### Example Plugin
A comprehensive example showing all plugin capabilities.

## 🤝 Contributing

1. Follow the plugin structure guidelines
2. Include comprehensive manifest files
3. Add proper error handling
4. Include frontend and backend components
5. Test with the plugin management system
6. Document your plugin's functionality

## 📄 License

This plugin system is part of the Remote GUI project and follows the same licensing terms.
