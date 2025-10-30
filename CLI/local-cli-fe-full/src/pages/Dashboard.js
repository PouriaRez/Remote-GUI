import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Client from './Client';
import Monitor from './Monitor';
import Policies from './Policies';
import AddData from './AddData';
import UserProfile from './UserProfile';
import ViewFiles from './ViewFiles';
import Presets from './Presets';
import Bookmarks from './Bookmarks';
import SqlQueryGenerator from './SqlQueryGenerator';
import BlockchainManager from './BlockchainManager';
import PluginManagement from './PluginManagement';

// Import plugin management API
import { getAllPlugins } from '../services/plugin_api';

import PolicyGeneratorPage from './Security';
// import Presets from './Presets';
import '../styles/Dashboard.css'; // dashboard-specific styles




const Dashboard = () => {
  // Plugin state
  const [pluginPages, setPluginPages] = useState({});
  const [pluginSidebarItems, setPluginSidebarItems] = useState([]);
  
  // Load initial state from localStorage
  const [nodes, setNodes] = useState(() => {
    const savedNodes = localStorage.getItem('dashboard-nodes');
    return savedNodes ? JSON.parse(savedNodes) : [];
  });
  
  const [selectedNode, setSelectedNode] = useState(() => {
    const savedSelectedNode = localStorage.getItem('dashboard-selected-node');
    return savedSelectedNode || null;
  });

  const [restoredFromStorage, setRestoredFromStorage] = useState(false);

  // Debug logging
  console.log("Dashboard - selectedNode:", selectedNode);
  console.log("Dashboard - nodes:", nodes);
  console.log("Dashboard - localStorage nodes:", localStorage.getItem('dashboard-nodes'));
  console.log("Dashboard - localStorage selectedNode:", localStorage.getItem('dashboard-selected-node'));

  // Save nodes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dashboard-nodes', JSON.stringify(nodes));
  }, [nodes]);

  // Save selectedNode to localStorage whenever it changes
  useEffect(() => {
    if (selectedNode) {
      localStorage.setItem('dashboard-selected-node', selectedNode);
      console.log("Saved selectedNode to localStorage:", selectedNode);
    } else {
      localStorage.removeItem('dashboard-selected-node');
      console.log("Removed selectedNode from localStorage");
    }
  }, [selectedNode]);

  // Ensure selectedNode is in nodes list if it exists
  useEffect(() => {
    if (selectedNode && !nodes.includes(selectedNode)) {
      console.log("Selected node not in nodes list, adding it:", selectedNode);
      setNodes(prevNodes => [...prevNodes, selectedNode]);
    }
  }, [selectedNode, nodes]);

  // Show restoration message if data was loaded from localStorage
  useEffect(() => {
    const hasStoredData = localStorage.getItem('dashboard-nodes') || localStorage.getItem('dashboard-selected-node');
    if (hasStoredData) {
      setRestoredFromStorage(true);
      // Auto-hide the message after 3 seconds
      const timer = setTimeout(() => {
        setRestoredFromStorage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load external plugins on component mount
  useEffect(() => {
    const loadPlugins = async () => {
      try {
        const plugins = await getAllPlugins();
        
        // Filter enabled plugins
        const enabledPlugins = plugins.filter(plugin => plugin.enabled);
        
        // Create plugin pages for routing
        const pages = {};
        const sidebarItems = [];
        
        enabledPlugins.forEach(plugin => {
          // Create a wrapper component that passes the plugin info
          const PluginComponent = React.lazy(() => 
            Promise.resolve({
              default: ({ node }) => <ExternalPluginComponent pluginInfo={plugin} node={node} />
            })
          );
          
          pages[plugin.name] = {
            component: PluginComponent,
            path: plugin.name,
            name: plugin.name.charAt(0).toUpperCase() + plugin.name.slice(1),
            icon: getPluginIcon(plugin.name),
            type: 'external',
            manifest: plugin
          };
          
          sidebarItems.push({
            path: plugin.name,
            name: plugin.name.charAt(0).toUpperCase() + plugin.name.slice(1),
            icon: getPluginIcon(plugin.name)
          });
        });
        
        setPluginPages(pages);
        setPluginSidebarItems(sidebarItems);
      } catch (error) {
        console.error('Failed to load external plugins:', error);
      }
    };
    
    loadPlugins();
  }, []);

  // Helper function to get plugin icon
  const getPluginIcon = (pluginName) => {
    const iconMap = {
      calculator: '🧮',
      nodecheck: '🔍',
      example_plugin: '🔌'
    };
    return iconMap[pluginName] || '🔌';
  };

  // External Plugin Component - defined outside the forEach to avoid hooks violations
  const ExternalPluginComponent = ({ pluginInfo, node }) => {
    const [pluginData, setPluginData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadPluginData = async () => {
        try {
          const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";
          
          // Try to get plugin info from its API
          const response = await fetch(`${API_URL}${pluginInfo.manifest?.api_prefix || `/${pluginInfo.name}`}/`);
          
          if (response.ok) {
            const data = await response.json();
            setPluginData(data);
          } else {
            setPluginData({
              name: pluginInfo.name,
              description: pluginInfo.description,
              version: pluginInfo.version,
              author: pluginInfo.author
            });
          }
        } catch (err) {
          console.warn(`Could not load data for plugin ${pluginInfo.name}:`, err);
          setPluginData({
            name: pluginInfo.name,
            description: pluginInfo.description,
            version: pluginInfo.version,
            author: pluginInfo.author
          });
        } finally {
          setLoading(false);
        }
      };

      loadPluginData();
    }, [pluginInfo]);

    if (loading) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Loading {pluginInfo.name} plugin...</h2>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px' }}>
        <h1>🔌 {pluginInfo.name.charAt(0).toUpperCase() + pluginInfo.name.slice(1)} Plugin</h1>
        
        {pluginData && (
          <div style={{ 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <h3>Plugin Information</h3>
            <p><strong>Description:</strong> {pluginData.description || pluginInfo.description}</p>
            <p><strong>Version:</strong> {pluginData.version || pluginInfo.version}</p>
            <p><strong>Author:</strong> {pluginData.author || pluginInfo.author}</p>
            <p><strong>Category:</strong> {pluginInfo.category}</p>
            {pluginInfo.tags && pluginInfo.tags.length > 0 && (
              <p><strong>Tags:</strong> {pluginInfo.tags.join(', ')}</p>
            )}
          </div>
        )}

        <div style={{ 
          background: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #bbdefb'
        }}>
          <h3>🔗 API Integration</h3>
          <p>This is an external plugin. You can interact with it through its API endpoints:</p>
          <p><strong>Base URL:</strong> <code>{window._env_?.REACT_APP_API_URL || "http://localhost:8000"}{pluginInfo.manifest?.api_prefix || `/${pluginInfo.name}`}</code></p>
          <p>Use the browser's developer tools or API testing tools to interact with the plugin's endpoints.</p>
        </div>

        {node && (
          <div style={{ 
            backgroundColor: '#d4edda', 
            padding: '15px', 
            borderRadius: '8px',
            border: '1px solid #c3e6cb' 
          }}>
            <h3>Connected Node:</h3>
            <p>This plugin is aware of the currently selected node: <code>{node}</code></p>
          </div>
        )}
      </div>
    );
  };

  // Utility function to clear all stored data
  const clearStoredData = () => {
    localStorage.removeItem('dashboard-nodes');
    localStorage.removeItem('dashboard-selected-node');
    setNodes([]);
    setSelectedNode(null);
    console.log("Cleared all stored dashboard data");
  };

  // Adds a new node (if valid and not already in the list)
  const handleAddNode = (newNode) => {
    if (newNode && !nodes.includes(newNode)) {
      setNodes((nodes) => [...nodes, newNode]);
      // Optionally set it as selected:
      // setSelectedNode(newNode);
    }
  };



  return (
    <div className="dashboard-container">
      <TopBar
        nodes={nodes}
        selectedNode={selectedNode}
        onAddNode={handleAddNode}
        onSelectNode={setSelectedNode}
        restoredFromStorage={restoredFromStorage}
        onClearStoredData={clearStoredData}
      />
      <div className="dashboard-content">
        <Sidebar pluginItems={pluginSidebarItems} />
        <div className="dashboard-main">
          <Routes>
            <Route path="client" element={<Client node = {selectedNode}/>} />
            <Route path="monitor" element={<Monitor node = {selectedNode}/>} />
            <Route path="policies" element={<Policies node = {selectedNode}/>} />
            <Route path="adddata" element={<AddData node = {selectedNode}/>} />
            <Route path="userprofile" element={<UserProfile node = {selectedNode}/>} />
            <Route path="viewfiles" element={<ViewFiles node = {selectedNode}/>} />
            <Route path="presets" element={<Presets node = {selectedNode} />} />
            <Route path="bookmarks" element={<Bookmarks node = {selectedNode} onSelectNode={(node) => {
              console.log("Selecting node from bookmarks:", node);
              // Add node to nodes list if not already present
              if (node && !nodes.includes(node)) {
                console.log("Adding new node to list:", node);
                setNodes(prevNodes => [...prevNodes, node]);
              }
              // Set as selected node
              setSelectedNode(node);
              console.log("Selected node set to:", node);
            }} />} />
            <Route path="sqlquery" element={<SqlQueryGenerator node = {selectedNode} />} />
            <Route path="blockchain" element={<BlockchainManager node = {selectedNode} />} />
            <Route path="security" element={<PolicyGeneratorPage node = {selectedNode} />} />
            <Route path="plugins" element={<PluginManagement node = {selectedNode} />} />
            
            {/* External Plugin Routes */}
            {Object.entries(pluginPages).map(([key, plugin]) => (
              <Route 
                key={key}
                path={plugin.path} 
                element={
                  <React.Suspense fallback={<div>Loading {plugin.name}...</div>}>
                    <plugin.component node={selectedNode} />
                  </React.Suspense>
                } 
              />
            ))}
            
            
            {/* Default view */}
            <Route path="*" element={<Client node = {selectedNode}/>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
