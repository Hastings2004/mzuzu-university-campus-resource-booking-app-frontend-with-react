import { createContext, useEffect, useState, useCallback, useRef } from "react";
import authService from "../services/authService";

export const AppContext = createContext();

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function AppProvider({ children }) {
  const [token, setToken] = useState(authService.getToken());
  const [user, setUser] = useState(authService.getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const activityTimeoutRef = useRef(null);

  // Function to perform logout actions
  const logout = useCallback(async () => {
    console.log("Logging out due to inactivity or explicit call...");
    await authService.logout();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  // Function to reset the inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (token) {
      activityTimeoutRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [token, logout]);

  // Function to fetch current user
  const fetchCurrentUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      authService.updateStoredUser(userData);
      resetInactivityTimer();
    } catch (error) {
      console.error("Error fetching user:", error);
      if (error.status === 401) {
        await logout();
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, logout, resetInactivityTimer]);

  // Effect to set up and clear activity listeners
  useEffect(() => {
    resetInactivityTimer();

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Attach event listeners to detect user activity
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("click", handleActivity);
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
  }, [resetInactivityTimer]);

  // Effect for fetching user data when token changes
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Function to update token (used by login/register)
  const updateToken = useCallback((newToken) => {
    setToken(newToken);
  }, []);

  // Function to update user data
  const updateUser = useCallback((userData) => {
    setUser(userData);
    authService.updateStoredUser(userData);
  }, []);

  return (
    <AppContext.Provider value={{ 
      token, 
      setToken: updateToken, 
      user, 
      setUser: updateUser, 
      logout,
      isLoading,
      isAuthenticated: authService.isAuthenticated()
    }}>
      {children}
    </AppContext.Provider>
  );
}