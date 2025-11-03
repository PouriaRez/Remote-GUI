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

// Import plugin loader
import { getPluginPages } from '../plugins/loader';

import PolicyGeneratorPage from './Security';
// import Presets from './Presets';
import '../styles/Dashboard.css'; // dashboard-specific styles
import { getBookmarks } from '../services/file_auth';




const Dashboard = () => {
  // Load plugin pages
  const pluginPages = getPluginPages();
  
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

  // On first load, if no selected node, use default bookmark if present
  useEffect(() => {
    (async () => {
      try {
        if (!selectedNode) {
          const res = await getBookmarks();
          const list = Array.isArray(res.data) ? res.data : [];
          const def = list.find(b => b.is_default);
          if (def && def.node) {
            setSelectedNode(def.node);
            if (!nodes.includes(def.node)) {
              setNodes(prev => [...prev, def.node]);
            }
          }
        }
      } catch (e) {
        // ignore failures silently
      }
    })();
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Sidebar />
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
            
            {/* Plugin Routes - Auto-loaded */}
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
