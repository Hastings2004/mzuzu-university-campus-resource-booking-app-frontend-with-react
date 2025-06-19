import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export const useInactivityLogout = () => {
  const { logout } = useAuth(); 
  const timeoutRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      console.log('User inactive, logging out...');
      logout(); // Call your actual logout function
    }, INACTIVITY_TIMEOUT);
  }, [logout]);

  useEffect(() => {
    // Initial setup
    resetTimer();

    const handleActivity = () => {
      resetTimer();
    };

    // Attach event listeners to detect user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Clean up event listeners on component unmount
    return () => {
      clearTimeout(timeoutRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, [resetTimer]);
};
