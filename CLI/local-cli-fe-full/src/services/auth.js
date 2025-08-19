


// Example: "sendCommand" function that POSTs a command to your server
export async function signup({ email, password, firstName, lastName }) {
    if (!email || !password || !firstName || !lastName) {
        alert('Missing required fields BITCHHHHH');
        return;
    }

    try {
        // Construct your request body
        // const requestBody = {
        //     info: { email: email, password: password, firstname: firstName, lastname: lastName },
        // };
        const requestBody = { email: email, password: password, firstname: firstName, lastname: lastName };

        // Example: a POST request using fetch
        // The URL here might be constructed using connectInfo or some known base URL
        const response = await fetch(`http://127.0.0.1:8000/signup/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Possibly include auth headers or other tokens here
            },
            body: JSON.stringify(requestBody),
        });

        console.log("Response: ", response);

        // Check if response is okay (2xx)
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status},  ${response}`);
        }

        // Parse JSON response
        const data = await response.json();

        if (data.data.session.access_token) {
            localStorage.setItem('accessToken', data.data.session.access_token);
        }
        if (data.data.session.refresh_token) {
            localStorage.setItem('refreshToken', data.data.session.refresh_token);
        }
        if (data.data.session.expires_at) {
            localStorage.setItem('expiresAt', data.data.session.expires_at);
        }

        console.log("Data: ", data);
        return data;
    } catch (error) {
        // Optionally handle errors
        console.error('Error signing up:', error);
        throw error; // re-throw so the component knows there was an error
    }
}


export async function login({ email, password }) {
    if (!email || !password) {
        alert('Missing required fields');
        return;
    }

    try {
        const requestBody = { email: email, password: password };

        const response = await fetch(`http://127.0.0.1:8000/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Possibly include auth headers or other tokens here
            },
            body: JSON.stringify(requestBody),
        });


        // Check if response is okay (2xx)
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status},  ${response}`);
        }

        console.log("Response: ", response);



        // Parse JSON response
        const data = await response.json();

        if (data.data.session.access_token) {
            localStorage.setItem('accessToken', data.data.session.access_token);
        }
        if (data.data.session.refresh_token) {
            localStorage.setItem('refreshToken', data.data.session.refresh_token);
        }
        if (data.data.session.expires_at) {
            localStorage.setItem('expiresAt', data.data.session.expires_at);
        }

        return data;
    } catch (error) {
        // Optionally handle errors
        console.error('Error logging in:', error);
        throw error; // re-throw so the component knows there was an error
    }
}



export async function logout() {

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresAt');

    try {

        const response = await fetch(`http://127.0.0.1:8000/logout/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Possibly include auth headers or other tokens here
            },
            // body: JSON.stringify(requestBody),
        });


        // Check if response is okay (2xx)
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status},  ${response}`);
        }

        console.log("Response: ", response);



        // // Parse JSON response
        const data = await response.json();

        return data;
    } catch (error) {
        // Optionally handle errors
        console.error('Error logging in:', error);
        throw error; // re-throw so the component knows there was an error
    }
}


export async function getUser() {
    try {

        const requestBody = { jwt: localStorage.getItem('accessToken') };
        const response = await fetch(`http://127.0.0.1:8000/get-user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Possibly include auth headers or other tokens here
            },
            body: JSON.stringify(requestBody),

        });

        console.log("Response: ", response);

        // Check if response is okay (2xx)
        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status},  ${response}`);
        }

        // Parse JSON response
        const data = await response.json();
        return data;
    } catch (error) {
        // Optionally handle errors
        console.error('Error logging in:', error);
        throw error; // re-throw so the component knows there was an error
    }
}



export function isLoggedIn() {
    // Check if the token is present in localStorage
//     console.log("Access Token: ", localStorage.getItem('accessToken'));

//     console.log("Expiry time:", localStorage.getItem('expiresAt'));

//    const expiresAt = localStorage.getItem('expiresAt');
//    const now = Date.now()/1000;
//    const expired = now >= expiresAt;


//    console.log("Current time:", now);
//    console.log("Expires at time:", expiresAt);
//    console.log("Is token expired?", expired);

//    if (expired) {
//        console.log("Token has expired");
//        localStorage.removeItem('accessToken');
//        localStorage.removeItem('refreshToken');
//        localStorage.removeItem('expiresAt');
//        return false;
//    }

//     return !!localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');
    if (!userId) {
        return false;
    }
    return true;

    // return true; // For testing purposes, always return true
  }