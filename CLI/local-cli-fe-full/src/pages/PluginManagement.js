import React, { useState, useEffect } from 'react';
import { 
  getAllPlugins, 
  togglePlugin, 
  searchPlugins, 
  discoverPlugins, 
  getPluginCategories 
} from '../services/plugin_api';

const PluginManagement = ({ node }) => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [categories, setCategories] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Load plugins and categories on component mount
  useEffect(() => {
    loadPlugins();
    loadCategories();
  }, []);

  // Remove automatic filtering - search only happens when button is clicked

  const loadPlugins = async () => {
    try {
      setLoading(true);
      const pluginsData = await getAllPlugins();
      setPlugins(pluginsData);
    } catch (error) {
      console.error('Failed to load plugins:', error);
      alert('Failed to load plugins: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await getPluginCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearchPlugins = async () => {
    try {
      setLoading(true);
      const pluginsData = await searchPlugins(searchQuery, selectedCategory, enabledOnly);
      setPlugins(pluginsData);
    } catch (error) {
      console.error('Failed to search plugins:', error);
      alert('Failed to search plugins: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlugin = async (pluginName, enabled) => {
    try {
      setActionLoading(prev => ({ ...prev, [pluginName]: true }));
      
      await togglePlugin(pluginName, enabled);

      // Reload plugins to get updated state
      await loadPlugins();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      alert('Failed to toggle plugin: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [pluginName]: false }));
    }
  };

  const handleDiscoverPlugins = async () => {
    try {
      setLoading(true);
      const result = await discoverPlugins();
      alert(result.message);
      
      // Reload plugins after discovery
      await loadPlugins();
    } catch (error) {
      console.error('Failed to discover plugins:', error);
      alert('Failed to discover plugins: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, enabled) => {
    if (status === 'loaded' && enabled) {
      return <span style={{ background: '#28a745', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Loaded</span>;
    } else if (enabled) {
      return <span style={{ background: '#ffc107', color: 'black', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Enabled</span>;
    } else {
      return <span style={{ background: '#6c757d', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>Disabled</span>;
    }
  };

  const getCategoryIcon = (category) => {
    return categories[category] || '🔌';
  };

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = !searchQuery || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || plugin.category === selectedCategory;
    const matchesEnabled = !enabledOnly || plugin.enabled;
    
    return matchesSearch && matchesCategory && matchesEnabled;
  });

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading plugins...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>🔌 Plugin Management</h1>
        <button 
          onClick={handleDiscoverPlugins}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔍 Discover Plugins
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Search:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plugins..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Categories</option>
              {Object.keys(categories).map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={enabledOnly}
                onChange={(e) => setEnabledOnly(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontWeight: 'bold' }}>Enabled Only</span>
            </label>
          </div>
          
          <button 
            onClick={handleSearchPlugins}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              height: 'fit-content'
            }}
          >
            🔍 Search
          </button>
        </div>
      </div>

      {/* Plugins List */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredPlugins.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3>No plugins found</h3>
            <p>Try adjusting your search criteria or discover new plugins.</p>
          </div>
        ) : (
          filteredPlugins.map(plugin => (
            <div 
              key={plugin.name}
              style={{ 
                background: 'white', 
                padding: '20px', 
                borderRadius: '8px',
                border: '1px solid #dee2e6',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px', marginRight: '10px' }}>
                      {getCategoryIcon(plugin.category)}
                    </span>
                    <h3 style={{ margin: 0, marginRight: '15px' }}>{plugin.name}</h3>
                    {getStatusBadge(plugin.status, plugin.enabled)}
                  </div>
                  
                  <p style={{ color: '#6c757d', margin: '5px 0' }}>
                    <strong>Version:</strong> {plugin.version} | 
                    <strong> Author:</strong> {plugin.author} | 
                    <strong> Category:</strong> {plugin.category}
                  </p>
                  
                  <p style={{ margin: '10px 0' }}>{plugin.description}</p>
                  
                  {plugin.tags.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      {plugin.tags.map(tag => (
                        <span 
                          key={tag}
                          style={{ 
                            background: '#e9ecef', 
                            color: '#495057', 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px',
                            marginRight: '5px'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div style={{ marginLeft: '20px' }}>
                  <button
                    onClick={() => handleTogglePlugin(plugin.name, !plugin.enabled)}
                    disabled={actionLoading[plugin.name]}
                    style={{
                      background: plugin.enabled ? '#dc3545' : '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: actionLoading[plugin.name] ? 'not-allowed' : 'pointer',
                      opacity: actionLoading[plugin.name] ? 0.6 : 1
                    }}
                  >
                    {actionLoading[plugin.name] ? '...' : (plugin.enabled ? 'Disable' : 'Enable')}
                  </button>
                </div>
              </div>
              
              {plugin.loaded_at && (
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '10px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  <strong>Loaded at:</strong> {new Date(plugin.loaded_at).toLocaleString()}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PluginManagement;
