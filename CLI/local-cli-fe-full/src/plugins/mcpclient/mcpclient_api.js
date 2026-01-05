// MCP Client Plugin API
// API client for MCP Client plugin

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

/**
 * Get MCP client information
 */
export const getMCPClientInfo = async () => {
  try {
    const response = await fetch(`${API_URL}/mcpclient/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching MCP client info:', error);
    throw error;
  }
};

/**
 * Get MCP client status
 */
export const getMCPStatus = async () => {
  try {
    const response = await fetch(`${API_URL}/mcpclient/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching MCP status:', error);
    throw error;
  }
};

/**
 * Connect to AnyLog MCP
 */
export const connectMCP = async (anylogSseUrl = null, ollamaModel = null) => {
  try {
    const response = await fetch(`${API_URL}/mcpclient/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        anylog_sse_url: anylogSseUrl,
        ollama_model: ollamaModel,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error connecting to MCP:', error);
    throw error;
  }
};

/**
 * Disconnect from AnyLog MCP
 */
export const disconnectMCP = async () => {
  try {
    const response = await fetch(`${API_URL}/mcpclient/disconnect`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error disconnecting from MCP:', error);
    throw error;
  }
};

/**
 * List available MCP tools
 */
export const listMCPTools = async () => {
  try {
    const response = await fetch(`${API_URL}/mcpclient/tools`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error listing MCP tools:', error);
    throw error;
  }
};

/**
 * Ask a question to the MCP agent
 */
export const askMCP = async (prompt, anylogSseUrl = null, ollamaModel = null) => {
  try {
    const response = await fetch(`${API_URL}/mcpclient/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        anylog_sse_url: anylogSseUrl,
        ollama_model: ollamaModel,
      }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error asking MCP:', error);
    throw error;
  }
};

