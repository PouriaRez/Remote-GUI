// src/components/TopBar.js
import React from 'react';
import '../styles/TopBar.css';
import logo from '../assets/logo.png';
import NodePicker from './NodePicker.js';

const TopBar = ({ nodes, selectedNode, onAddNode, onSelectNode }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={logo} alt="App Logo" className="logo" />
        <NodePicker 
          nodes={nodes} 
          selectedNode={selectedNode} 
          onAddNode={onAddNode} 
          onSelectNode={onSelectNode} 
        />
      </div>
      <div className="topbar-right">
        {/* User Profile removed - no authentication required */}
      </div>
    </header>
  );
};

export default TopBar;
