// External Plugin Components Library
// This file provides easy access to commonly used components and utilities
// for external plugin developers.

import React from 'react';

// Re-export React hooks and utilities that plugins commonly need
export { useState, useEffect, useCallback, useMemo, useContext } from 'react';

// Import and re-export AnylogJsonTable from the main application
export { default as AnylogJsonTable } from '../CLI/local-cli-fe-full/src/components/AnylogJsonTable';

// Common Styling Utilities
export const commonStyles = {
  // Color palette
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    white: '#ffffff',
    black: '#000000'
  },
  
  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  // Border radius
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%'
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    lg: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
    xl: '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)'
  },
  
  // Typography
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

// Common component patterns for plugins
export const PluginCard = ({ title, children, icon, actions, ...props }) => (
  <div 
    style={{
      background: 'white',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid #dee2e6',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      ...props.style
    }}
    {...props}
  >
    {title && (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '15px',
        borderBottom: '1px solid #e9ecef',
        paddingBottom: '10px'
      }}>
        {icon && <span style={{ marginRight: '10px', fontSize: '20px' }}>{icon}</span>}
        <h3 style={{ margin: 0, color: '#495057' }}>{title}</h3>
        {actions && (
          <div style={{ marginLeft: 'auto' }}>
            {actions}
          </div>
        )}
      </div>
    )}
    {children}
  </div>
);

export const PluginSection = ({ title, children, collapsible = false, ...props }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  return (
    <div 
      style={{
        marginBottom: '20px',
        ...props.style
      }}
      {...props}
    >
      {title && (
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '15px',
            cursor: collapsible ? 'pointer' : 'default'
          }}
          onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <h4 style={{ margin: 0, color: '#495057' }}>{title}</h4>
          {collapsible && (
            <span style={{ marginLeft: '10px', fontSize: '14px' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
        </div>
      )}
      {(!collapsible || isExpanded) && children}
    </div>
  );
};

export const PluginButton = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseStyle = {
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    ...props.style
  };
  
  const variants = {
    primary: {
      background: '#007bff',
      color: 'white',
      '&:hover': { background: '#0056b3' }
    },
    secondary: {
      background: '#6c757d',
      color: 'white',
      '&:hover': { background: '#545b62' }
    },
    success: {
      background: '#28a745',
      color: 'white',
      '&:hover': { background: '#1e7e34' }
    },
    danger: {
      background: '#dc3545',
      color: 'white',
      '&:hover': { background: '#c82333' }
    },
    warning: {
      background: '#ffc107',
      color: '#212529',
      '&:hover': { background: '#e0a800' }
    },
    info: {
      background: '#17a2b8',
      color: 'white',
      '&:hover': { background: '#138496' }
    },
    outline: {
      background: 'transparent',
      color: '#007bff',
      border: '1px solid #007bff',
      '&:hover': { background: '#007bff', color: 'white' }
    }
  };
  
  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px' },
    md: { padding: '8px 16px', fontSize: '14px' },
    lg: { padding: '12px 24px', fontSize: '16px' }
  };
  
  return (
    <button
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size]
      }}
      {...props}
    >
      {children}
    </button>
  );
};

// Default export with all components
export default {
  // React utilities
  React,
  
  // Common styles
  commonStyles,
  
  // Plugin-specific components
  PluginCard,
  PluginSection,
  PluginButton
};
