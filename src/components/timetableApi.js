
const BASE_URL = 'http://localhost:8000/api'; 

const timetableAPI = {
    /**
     * Sends the Excel/CSV file to the backend for timetable import using fetch.
     * @param {File} file The file object to upload.
     * @param {string} token The authentication token from AppContext.
     * @returns {Promise<any>} The parsed JSON response from the API.
     * @throws {Error} If the network request fails or API returns an error.
     */
    importTimetable: async (file, token) => {
        const formData = new FormData();
        formData.append('file', file); // 'file' must match the key expected by your Laravel backend

        const response = await fetch(`${BASE_URL}/timetable/import`, {
            method: 'POST',
            headers: {
                // 'Content-Type': 'multipart/form-data' is handled automatically by fetch
                // when you pass a FormData object directly as the body.
                // Explicitly setting it can sometimes cause issues.
                'Accept': 'application/json', // Indicate that we prefer JSON response
                'Authorization': `Bearer ${token}`, // Pass the authentication token
            },
            body: formData,
        });

        const data = await response.json();

        // Check for HTTP success status (200-299) first
        if (!response.ok) {
            // If response is not ok, throw an error with backend's error message
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        // Now check the application-level 'success' flag
        if (!data.success) {
            // If the backend explicitly returned success: false, throw that error
            throw new Error(data.error || 'Backend reported a non-successful operation.');
        }

        return data; // Return the successful data (e.g., { success: true, message: '...' })
    },

    // Example of another method using fetch and token
    getTimetable: async (token, params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${BASE_URL}/timetable?${query}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || `Failed to fetch timetable: ${response.status}`);
        }
        return data;
    },

    checkConflicts: async (data, token) => {
        const response = await fetch(`${BASE_URL}/timetable/check-conflicts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.error || `Failed to check conflicts: ${response.status}`);
        }
        return responseData;
    },

    bookRoom: async (data, token) => {
        const response = await fetch(`${BASE_URL}/bookings`, { // Assuming /api/bookings
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
        const responseData = await response.json();
        if (!response.ok || !responseData.success) {
            throw new Error(responseData.error || `Failed to book room: ${response.status}`);
        }
        return responseData;
    }
};

export default timetableAPI;