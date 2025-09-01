// src/components/NodePicker.js
import React, { useState } from 'react';
import { getConnectedNodes } from '../services/api'; // Adjust the import path as necessary
import { bookmarkNode } from '../services/file_auth';
import '../styles/NodePicker.css'; // Optional: create a CSS file for node picker styling
import { isLoggedIn } from '../services/file_auth';
import { useEffect } from 'react';

const NodePicker = ({ nodes, selectedNode, onAddNode, onSelectNode, onBookmarkAdded }) => {
  const [newNode, setNewNode] = useState('');
  const [error, setError] = useState(null);
  const [local, setLocal] = useState(false);
  const [bookmarkMsg, setBookmarkMsg] = useState(null);

  useEffect(() => {
    if (!bookmarkMsg) return;

    const timer = setTimeout(() => {
      setBookmarkMsg(null);
    }, 5000); // 3000ms = 3s

    return () => clearTimeout(timer);
  }, [bookmarkMsg]);


  const handleAdd = () => {
    // Basic validation: check that new node is not empty, and ideally matches "ip:port" format
    if (newNode.trim()) {
      onAddNode(newNode.trim());
      onSelectNode(newNode.trim());
      setNewNode('');
    }
  };

  const handleAddConnectedNodes = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log("Selected Node is this:", selectedNode);
      const fetchedNodes = await getConnectedNodes({ selectedNode });
      for (const node of fetchedNodes.data) {
        console.log(node);
        onAddNode(node);
      }

    } catch (err) {
      setError("Failed to test network.");
    }
  };


  const makeLocal = (node, isLocal) => {
    if (!node) return node;  // Return if node is empty
    const parts = node.split(':');
    if (isLocal && parts.length === 2) {  // Check if local is true and node is in "ip:port" format
      console.log("MADE LOCAL")
      return `127.0.0.1:${parts[1]}`;
    }
    return node;
  };

  const handleLocalChange = (e) => {
    const isLocal = e.target.checked;
    setLocal(isLocal);
    console.log("Local mode is now:", e.target.checked);
    // console.log("makeLocal is now:", makeLocal(selectedNode));
    onSelectNode(makeLocal(selectedNode, isLocal));
  }

  const handleBookmark = async () => {
    if (!selectedNode) {
      setBookmarkMsg('No node selected to bookmark.');
      return;
    }
    setError(null);
    setBookmarkMsg(null);

    try {
      if (isLoggedIn()) {
        await bookmarkNode({ node: selectedNode });
        setBookmarkMsg(`Bookmarked ${selectedNode}!`);
        
        // Dispatch event to refresh bookmarks globally
        window.dispatchEvent(new Event('bookmark-refresh'));
        
        // Call the callback to refresh bookmarks in parent component
        if (onBookmarkAdded) {
          onBookmarkAdded();
        }
      }
    } catch (err) {
      console.error('Bookmark failed:', err);
      setError('Could not bookmark node. Try again.');
    }
  };


  return (
    <div className="node-picker-container">
      <select
        className="node-picker-select"
        value={selectedNode}
        onChange={(e) => onSelectNode(e.target.value)}
      >
        {nodes.map((node, index) => (
          <option key={index} value={node}>
            {node}
          </option>
        ))}
      </select>
      <input
        className="node-picker-input"
        type="text"
        placeholder="Connection (IP:Port)"
        value={newNode}
        onChange={(e) => setNewNode(e.target.value)}
      />
      <button className="node-picker-btn" onClick={handleAdd}>
        Use
      </button>
      {/* <button className="node-picker-btn" onClick={handleAddConnectedNodes}>
        Add Connected Nodes
      </button> */}
      {/* <button className="node-picker-btn" onClick={handleBookmark}>
        Bookmark
      </button> */}
      {/* <label className="local-label">
        <input type="checkbox" checked={local} onChange={handleLocalChange} />
        Local
      </label> */}
      {bookmarkMsg && (
        <div className="bookmark-msg" style={{ color: 'red', marginTop: '0.5rem', marginBlockStart: '0.5rem' }}>
          {bookmarkMsg}
        </div>
      )}
      {error && (
        <div className="error" style={{ color: 'red', marginTop: '0.5rem' }}>
          {error}
        </div>
      )}
    </div>
  );
};


export default NodePicker;

