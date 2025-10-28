// src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { getPluginSidebarItems } from '../plugins/loader';
import '../styles/Sidebar.css';

const Sidebar = () => {
  // Get plugin sidebar items
  const pluginItems = getPluginSidebarItems();
  
  return (
    <nav className="sidebar">
      <NavLink to="client" className={({ isActive }) => isActive ? 'active' : ''}>Client</NavLink>
      <NavLink to="monitor" className={({ isActive }) => isActive ? 'active' : ''}>Monitor</NavLink>
      <NavLink to="policies" className={({ isActive }) => isActive ? 'active' : ''}>Policies</NavLink>
      <NavLink to="adddata" className={({ isActive }) => isActive ? 'active' : ''}>Add Data</NavLink>
      <NavLink to="viewfiles" className={({ isActive }) => isActive ? 'active' : ''}>View Files</NavLink>
      <NavLink to="sqlquery" className={({ isActive }) => isActive ? 'active' : ''}>SQL Query</NavLink>
      <NavLink to="blockchain" className={({ isActive }) => isActive ? 'active' : ''}>Blockchain Manager</NavLink>
      <NavLink to="presets" className={({ isActive }) => isActive ? 'active' : ''}>Presets</NavLink>
      <NavLink to="bookmarks" className={({ isActive }) => isActive ? 'active' : ''}>Bookmarks</NavLink>
      <NavLink to="security" className={({ isActive }) => isActive ? 'active' : ''}>Security (Anylog)</NavLink>
      
      {/* Plugin Navigation - Auto-loaded */}
      {pluginItems.length > 0 && (
        <div className="plugin-section">
          {pluginItems.map((plugin) => (
            <NavLink 
              key={plugin.path}
              to={plugin.path} 
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              {plugin.icon && `${plugin.icon} `}{plugin.name}
            </NavLink>
          ))}
        </div>
      )}
      
    </nav>
  );
};

export default Sidebar;
