// src/context/appContext.js
import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();

export default function AppProvider({ children }) {
    // 1. Initialize token and user from localStorage if available
    // This prevents a flash/redirect to login if a token exists from a previous session.
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem("user");
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage:", error);
            return null;
        }
    });

    // 2. Add a loading state for initial user data fetch
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Function to fetch user data from the backend
    async function fetchUserData() { // Renamed from getUser for clarity with fetch
        if (!token) {
            // No token, so no user to fetch. Set loading to false.
            setIsLoadingUser(false);
            return;
        }

        try {
            setIsLoadingUser(true); // Start loading
            const response = await fetch("/api/user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data);
                localStorage.setItem("user", JSON.stringify(data)); // Store fetched user in localStorage
            } else {
                // Handle API errors (e.g., token expired, invalid)
                console.error("Failed to fetch user data:", data.message || "Unknown error");
                // Clear token and user if fetching failed
                setToken(null);
                setUser(null);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
            }
        } catch (error) {
            // Handle network errors
            console.error("Network error fetching user data:", error);
            // Clear token and user on network error
            setToken(null);
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        } finally {
            setIsLoadingUser(false); // End loading regardless of success or failure
        }
    }

    // 3. useEffect to trigger user data fetch
    // This runs on mount if a token exists, or when the token changes.
    useEffect(() => {
        // Only attempt to fetch user data if a token exists AND
        // the user object hasn't been loaded yet (or explicitly cleared)
        if (token && !user) { // Added !user check to prevent unnecessary re-fetches if user is already populated from localStorage on initial render
            fetchUserData();
        } else {
            // If no token, or user was already loaded from localStorage,
            // we are done with the initial loading phase.
            setIsLoadingUser(false);
        }
    }, [token]); // Dependency array: re-run if token changes

    // Provide all necessary states and setters to the context
    return (
        <AppContext.Provider value={{ token, setToken, user, setUser, isLoadingUser }}>
            {children}
        </AppContext.Provider>
    );
}