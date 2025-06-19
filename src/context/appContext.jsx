import { createContext, useEffect, useState, useCallback, useRef } from "react";

export const AppContext = createContext();

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function AppProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const activityTimeoutRef = useRef(null); // Ref to store the timeout ID

  // Function to perform logout actions
  const logout = useCallback(async () => {
    console.log("Logging out due to inactivity or explicit call...");

    // 1. Invalidate token on the backend
    if (token) {
      try {
        // Adjust this URL to your Laravel backend's logout endpoint
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Include Authorization header if your backend requires it for logout
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("Backend logout successful (or attempted).");
      } catch (error) {
        console.error("Error during backend logout:", error);
        // Even if backend logout fails, proceed with frontend logout
      }
    }

    // 2. Clear frontend state
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);

    // 3. Redirect to login page
    // Adjust this to your login route
    window.location.href = "/login"; // Or use your router's navigate/history.push
  }, [token]); // token is a dependency because the fetch uses it

  // Function to reset the inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (token) { // Only set timer if user is logged in (has a token)
      activityTimeoutRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [logout, token]); // logout and token are dependencies

  // Effect to set up and clear activity listeners
  useEffect(() => {
    // Initial timer setup if a token exists
    resetInactivityTimer();

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Attach event listeners to detect user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("click", handleActivity);
    // Add touch events for mobile web
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("touchend", handleActivity);

    // Clean up event listeners and timer on component unmount or token change
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("touchend", handleActivity);
    };
  }, [resetInactivityTimer]); // resetInactivityTimer is a dependency

  // Original getUser function
  async function getUser() {
    if (!token) {
      // If no token, no need to fetch user, perhaps means user is logged out
      setUser(null);
      return;
    }
    try {
      const response = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        // Important: Reset timer after a successful API call (indicates activity)
        resetInactivityTimer();
      } else if (response.status === 401) {
        // If the token is invalid or expired (401 Unauthorized), log out
        console.log("Token expired or invalid, logging out.");
        logout();
      } else {
        console.error("Failed to fetch user:", data);
        setUser(null); // Clear user if fetch fails for other reasons
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      // Network error, etc.
      setUser(null);
    }
  }

  // Effect for fetching user data when token changes
  useEffect(() => {
    if (token) {
      getUser();
    } else {
      setUser(null); // Clear user if token becomes null (e.g., after logout)
    }
  }, [token]); // getUser is no longer a direct dependency if called inside this effect with `token`

  return (
    <AppContext.Provider value={{ token, setToken, user, setUser, logout }}>
      {children}
    </AppContext.Provider>
  );
}