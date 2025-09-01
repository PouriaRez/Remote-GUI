// File-based service for managing bookmarks, presets, and other file operations
// No user authentication required

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

// Authentication functions removed - no user concept
export function isLoggedIn() {
    // Always return true since no authentication is required
    return true;
}

// Bookmark functions
export async function bookmarkNode({ node }) {
    if (!node) {
        throw new Error('Node is required');
    }

    try {
        const response = await fetch(`${API_URL}/bookmarks/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ node }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error bookmarking node:', error);
        throw error;
    }
}

export async function getBookmarks() {
    try {
        const response = await fetch(`${API_URL}/bookmarks/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        throw error;
    }
}

export async function deleteBookmarkedNode({ node }) {
    if (!node) {
        throw new Error('Node is required');
    }

    try {
        const response = await fetch(`${API_URL}/bookmarks/delete/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ node }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting bookmarked node:', error);
        throw error;
    }
}

export async function updateBookmarkDescription({ node, description }) {
    if (!node) {
        throw new Error('Node is required');
    }

    try {
        const response = await fetch(`${API_URL}/bookmarks/update/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ node, description }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating bookmark description:', error);
        throw error;
    }
}

// Preset group functions
export async function addPresetGroup({ name }) {
    if (!name || !name.trim()) {
        throw new Error('Group name is required');
    }

    try {
        const response = await fetch(`${API_URL}/preset-groups/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding preset group:', error);
        throw error;
    }
}

export async function getPresetGroups() {
    try {
        const response = await fetch(`${API_URL}/preset-groups/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching preset groups:', error);
        throw error;
    }
}

export async function deletePresetGroup({ groupId, groupName }) {
    if (!groupId) {
        throw new Error('Group ID is required');
    }

    try {
        const response = await fetch(`${API_URL}/preset-groups/delete/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ groupId, groupName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting preset group:', error);
        throw error;
    }
}

// Preset functions
export async function addPreset({ preset }) {
    if (!preset || !preset.command || !preset.type || !preset.button || !preset.groupName) {
        throw new Error('Preset must have command, type, button, and groupName');
    }

    try {
        const response = await fetch(`${API_URL}/presets/add/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preset),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding preset:', error);
        throw error;
    }
}

export async function getPresetsByGroup({ groupId }) {
    if (!groupId) {
        throw new Error('Group ID is required');
    }

    try {
        const response = await fetch(`${API_URL}/presets/by-group/${groupId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching presets by group:', error);
        throw error;
    }
}

export async function deletePreset({ presetId }) {
    if (!presetId) {
        throw new Error('Preset ID is required');
    }

    try {
        const response = await fetch(`${API_URL}/presets/delete/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ presetId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting preset:', error);
        throw error;
    }
}

// Utility functions
export function getCurrentUser() {
    // Return a default user object since no authentication is required
    return {
        id: 'default',
        email: 'default@example.com',
        firstname: 'Default',
        lastname: 'User'
    };
}

export function clearUserData() {
    // No user data to clear
    console.log('No user data to clear');
} 