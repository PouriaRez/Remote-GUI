// Plugin Management API Functions
// Centralized API calls for plugin management functionality

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

/**
 * Get all plugins
 */
export const getAllPlugins = async () => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/plugins`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling getAllPlugins:', error);
    throw error;
  }
};

/**
 * Get information about a specific plugin
 */
export const getPluginInfo = async (pluginName) => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/plugins/${pluginName}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling getPluginInfo:', error);
    throw error;
  }
};

/**
 * Toggle plugin enable/disable state
 */
export const togglePlugin = async (pluginName, enabled) => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/plugins/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plugin_name: pluginName,
        enabled: enabled
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling togglePlugin:', error);
    throw error;
  }
};

/**
 * Search and filter plugins
 */
export const searchPlugins = async (searchQuery, category, enabledOnly) => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/plugins/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery || null,
        category: category || null,
        enabled_only: enabledOnly
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling searchPlugins:', error);
    throw error;
  }
};

/**
 * Force re-discovery of plugins
 */
export const discoverPlugins = async () => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/plugins/discover`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling discoverPlugins:', error);
    throw error;
  }
};

/**
 * Get plugin system configuration
 */
export const getPluginConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/config`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling getPluginConfig:', error);
    throw error;
  }
};

/**
 * Get available plugin categories
 */
export const getPluginCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/plugin-management/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling getPluginCategories:', error);
    throw error;
  }
};

// Default export with all functions
export default {
  getAllPlugins,
  getPluginInfo,
  togglePlugin,
  searchPlugins,
  discoverPlugins,
  getPluginConfig,
  getPluginCategories
};
