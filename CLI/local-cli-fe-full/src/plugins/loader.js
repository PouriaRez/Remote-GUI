// Fully Automatic Frontend Plugin Loader
// Auto-discovers plugin pages by scanning the plugins directory

import React from 'react';

// Auto-discover plugin pages by attempting imports
// Uses webpack's require.context to find all plugin Page.js files
export const discoverPluginPages = () => {
  const pluginPages = {};
  
  // Use require.context to get all plugin Page.js files
  // Pattern: ./pluginname/PluginnamePage.js
  const pluginContext = require.context('./', true, /^\.\/[^/]+\/[A-Z][^/]*Page\.js$/);
  
  pluginContext.keys().forEach(modulePath => {
    try {
      // Extract plugin name from path: ./pluginname/PluginnamePage.js
      const pathParts = modulePath.split('/');
      const pluginName = pathParts[1]; // Get the folder name
      const pageFileName = pathParts[2]; // Get the Page.js filename
      
      // Skip if we've already loaded this plugin
      if (pluginPages[pluginName]) {
        return;
      }
      
      // Import the module synchronously to get metadata
      const module = pluginContext(modulePath);
      
      // Get metadata from the module (each Page.js should export pluginMetadata)
      const metadata = module.pluginMetadata || {};
      
      // Create lazy-loaded component that imports dynamically
      // Store the modulePath for dynamic import
      const importPath = modulePath.replace(/^\.\//, './').replace(/\.js$/, '');
      
      const PluginPage = React.lazy(() => 
        import(`./${pluginName}/${pageFileName.replace(/\.js$/, '')}`)
          .catch(() => {
            // Fallback if import fails
            return {
              default: () => (
                <div style={{ padding: '20px' }}>
                  <h1>Plugin Not Found</h1>
                  <p>The {pluginName} plugin could not be loaded.</p>
                </div>
              )
            };
          })
      );
      
      pluginPages[pluginName] = {
        component: PluginPage,
        path: pluginName,
        name: metadata.name || formatPluginName(pluginName),
        icon: metadata.icon || null
      };
    } catch (error) {
      console.warn(`Failed to load plugin from ${modulePath}:`, error);
    }
  });
  
  return pluginPages;
};

// Helper function to format plugin name (fallback if metadata not provided)
const formatPluginName = (pluginName) => {
  // Convert camelCase or lowercase to Title Case
  // e.g., "reportgenerator" -> "Report Generator"
  // e.g., "nodeCheck" -> "Node Check"
  
  // Try to detect word boundaries
  const words = pluginName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between lowercase and uppercase
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  // Capitalize first letter of each word
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get plugin pages for routing
export const getPluginPages = () => {
  return discoverPluginPages();
};

// Get plugin sidebar items
export const getPluginSidebarItems = () => {
  const pages = discoverPluginPages();
  return Object.values(pages).map(plugin => ({
    path: plugin.path,
    name: plugin.name,
    icon: plugin.icon
  }));
};
