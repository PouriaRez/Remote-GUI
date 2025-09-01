import React, { useState } from 'react';
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
// import Presets from './Presets';
import '../styles/Dashboard.css'; // dashboard-specific styles



const Dashboard = () => {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // console.log(localStorage);

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
            <Route path="bookmarks" element={<Bookmarks node = {selectedNode} />} />
            <Route path="sqlquery" element={<SqlQueryGenerator node = {selectedNode} />} />
            {/* Default view */}
            <Route path="*" element={<Client node = {selectedNode}/>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
