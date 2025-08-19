// File-based authentication service
// Replaces the old JWT-based authentication system

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

// Helper function to get user ID from localStorage
const getUserId = () => {
    const userId = localStorage.getItem('userId');
    console.log("User ID: ", userId);
    if (!userId) {
        throw new Error('User not authenticated');
    }
    return userId;
};

// Authentication functions
export async function signup({ email, password, firstName, lastName }) {
    if (!email || !password || !firstName || !lastName) {
        throw new Error('Missing required fields');
    }

    try {
        const requestBody = { 
            email: email, 
            password: password, 
            firstname: firstName, 
            lastname: lastName 
        };

        const response = await fetch(`${API_URL}/auth/signup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.user) {
            localStorage.setItem('userId', data.data.user.id);
            localStorage.setItem('userEmail', data.data.user.email);
            localStorage.setItem('userFirstName', data.data.user.firstname);
            localStorage.setItem('userLastName', data.data.user.lastname);
        }

        return data;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

export async function login({ email, password }) {
    if (!email || !password) {
        throw new Error('Missing required fields');
    }

    try {
        const requestBody = { email: email, password: password };

        const response = await fetch(`${API_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Server responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.data && data.data.user) {
            localStorage.setItem('userId', data.data.user.id);
            localStorage.setItem('userEmail', data.data.user.email);
            localStorage.setItem('userFirstName', data.data.user.firstname);
            localStorage.setItem('userLastName', data.data.user.lastname);
        }

        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}

export async function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');

    try {
        const response = await fetch(`${API_URL}/auth/logout/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
    }
}

export async function getUser() {
    try {
        const userId = getUserId();

        const requestBody = { jwt: userId };
        const response = await fetch(`${API_URL}/auth/get-user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting user:', error);
        throw error;
    }
}

export function isLoggedIn() {
    const userId = localStorage.getItem('userId');
    return !!userId;
}

// Bookmark functions
export async function bookmarkNode({ node }) {
    if (!node) {
        throw new Error('Missing node parameter');
    }
    console.log("Bookmarking node: ", node);

    try {
        const userId = getUserId();

        const requestBody = {
            token:{jwt: userId},
            conn:{conn: node}
        };

        const response = await fetch(`${API_URL}/auth/bookmark-node/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error bookmarking node:', error);
        throw error;
    }
}

export async function getBookmarks() {
    try {
        const userId = getUserId();

        const requestBody = { jwt: userId };

        const response = await fetch(`${API_URL}/auth/get-bookmarked-nodes/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting bookmarks:', error);
        throw error;
    }
}

export async function deleteBookmarkedNode({ node }) {
    if (!node) {
        throw new Error('Missing node parameter');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token:{jwt: userId},
            conn:{conn: node}
        };

        const response = await fetch(`${API_URL}/auth/delete-bookmarked-node/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting bookmarked node:', error);
        throw error;
    }
}

export async function updateBookmarkDescription({ node, description }) {
    if (!node || !description) {
        throw new Error('Missing node or description parameter');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token:{jwt: userId},
            node: node,
            description: description
        };

        const response = await fetch(`${API_URL}/auth/update-bookmark-description/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error updating bookmark description:', error);
        throw error;
    }
}

// Preset group functions
export async function addPresetGroup({ name }) {
    if (!name) {
        throw new Error('Missing group name');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token:{jwt: userId},
            group: { group_name: name }
        };

        const response = await fetch(`${API_URL}/auth/add-preset-group/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding preset group:', error);
        throw error;
    }
}

export async function getPresetGroups() {
    try {
        const userId = getUserId();

        const requestBody = { jwt: userId };

        const response = await fetch(`${API_URL}/auth/get-preset-groups/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting preset groups:', error);
        throw error;
    }
}

export async function deletePresetGroup({ groupId, groupName }) {
    if (!groupId || !groupName) {
        throw new Error('Missing group ID or group name');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token: {jwt: userId},
            group_id: {group_id: groupId},
            group: {group_name: groupName}
        };

        console.log("Delete group request body:", requestBody);

        const response = await fetch(`${API_URL}/auth/delete-preset-group/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Delete group response error:", response.status, errorText);
            throw new Error(`Server responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Delete group response:", data);
        return data;
    } catch (error) {
        console.error('Error deleting preset group:', error);
        throw error;
    }
}

// Preset functions
export async function addPreset({ preset }) {
    if (!preset || !preset.command || !preset.type || !preset.button || !preset.group_id) {
        throw new Error('Missing required preset fields');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token: {jwt: userId}, 
            preset: preset
        };

        console.log("Request body: ", requestBody);

        const response = await fetch(`${API_URL}/auth/add-preset/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error adding preset:', error);
        throw error;
    }
}

export async function getPresetsByGroup({ groupId }) {
    if (!groupId) {
        throw new Error('Missing group ID');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token: {
              jwt: userId
            },
            group_id: {
              group_id: groupId
            }
          };

        console.log("Request body: ", requestBody);

        const response = await fetch(`${API_URL}/auth/get-presets/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting presets by group:', error);
        throw error;
    }
}

export async function deletePreset({ presetId }) {
    if (!presetId) {
        throw new Error('Missing preset ID');
    }

    try {
        const userId = getUserId();

        const requestBody = {
            token: {
                jwt: userId
            },
            preset_id: {
                preset_id: presetId
            }
        };

        console.log("Delete preset request body: ", requestBody);

        const response = await fetch(`${API_URL}/auth/delete-preset/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting preset:', error);
        throw error;
    }
}

// Utility functions
export function getCurrentUser() {
    return {
        id: localStorage.getItem('userId'),
        email: localStorage.getItem('userEmail'),
        firstName: localStorage.getItem('userFirstName'),
        lastName: localStorage.getItem('userLastName')
    };
}

export function clearUserData() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
} 