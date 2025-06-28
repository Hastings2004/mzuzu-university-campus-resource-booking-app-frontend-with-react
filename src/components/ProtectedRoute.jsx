import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AppContext } from '../context/appContext';

export default function ProtectedRoute({ children, requireAuth = true, requireVerification = true, adminOnly = false }) {
    const { user, token, isLoading, isAuthenticated } = useContext(AppContext);
    const location = useLocation();

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    // Check if authentication is required and user is not authenticated
    if (requireAuth && !isAuthenticated) {
        // Redirect to login with return URL
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if email verification is required and user is not verified
    if (requireVerification && user && !user.email_verified_at) {
        // Redirect to email verification required page
        return <Navigate to="/email-verification-required" state={{ from: location }} replace />;
    }

    // Check if admin access is required and user is not admin
    if (adminOnly && user && user.user_type !== 'admin') {
        // Redirect to unauthorized page or home
        return <Navigate to="/unauthorized" replace />;
    }

    // All checks passed, render the protected content
    return children;
} 