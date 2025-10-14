// src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
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
      <NavLink to="security" className={({ isActive }) => isActive ? 'active' : ''}>Security</NavLink>
    </nav>
  );
};

export default Sidebar;
