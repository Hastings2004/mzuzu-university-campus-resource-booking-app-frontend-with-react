// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/home';
import Layout from './components/layout';
import Login from './auth/login';
import Register from './auth/register';
import { useContext, useEffect, useState } from 'react'; // Import useEffect and useState
import { AppContext } from './context/appContext';
import Create from './resources/create'; // Assuming Create is `CreateResource` now
import View from './resources/view'; // Assuming this is ViewResource
import MyBookings from './Bookings/showsBookings';
import ViewBooking from './Bookings/viewBooking';
import UpdateBooking from './Bookings/updateBooking';
import ShowProfile from './profile/showProfile';
import Statistical from './admin/statistical';
import ResourceSearch from './resources/searchResource';
import UserManagement from './admin/userManagement';
import Settings from './components/settings';
import Notifications from './components/notifications';
import EmailVerificationPage from './auth/EmailVerificationPage'; // New component
import EmailVerifyRequiredPage from './auth/EmailVerifyRequiredPage'; // New component (optional, but good UX)

// --- ProtectedRoute Component ---
const ProtectedRoute = ({ children }) => {
    const { user, token, isLoadingUser } = useContext(AppContext);

    if (isLoadingUser) {
        return <div className="loading-message">Loading user session...</div>; // Or a spinner
    }

    // If no user or token, redirect to login
    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    // If user exists but email is not verified, redirect to verification required page
    if (!user.email_verified_at) {
        return <Navigate to="/email-verify-required" replace />;
    }

    return children;
};

export default function App() {
    const { user, isLoadingUser } = useContext(AppContext);

    if (isLoadingUser) {
        return <div className="loading-message">Initializing application...</div>; // Show a loading screen while AppContext fetches user
    }

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes (no auth or verification required) */}
                <Route path="/login" element={user && user.email_verified_at ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/register" element={user && user.email_verified_at ? <Navigate to="/" replace /> : <Register />} />
                {/* Route for the email verification link from the email */}
                <Route path="/email/verify/:id/:hash" element={<EmailVerificationPage />} />
                {/* Informational page for unverified users */}
                <Route path="/email-verify-required" element={<EmailVerifyRequiredPage />} />

                {/* Main application layout route - protected */}
                {/* If user is not logged in or email not verified, they will be redirected by ProtectedRoute */}
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    {/* Nested routes for authenticated and verified users */}
                    <Route index element={<Home />} />
                    <Route path="createResource" element={<Create />} /> {/* Assuming Create is imported from resources/create */}
                    <Route path="resources/:id" element={<View />} />
                    <Route path="bookings/:id/edit" element={<UpdateBooking />} />
                    <Route path='profile' element={<ShowProfile />} />
                    <Route path='statistical' element={<Statistical />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="booking" element={<MyBookings />} />
                    <Route path="booking/:id" element={<ViewBooking />} />
                    <Route path="search" element={<ResourceSearch />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="notifications" element={<Notifications />} />
                </Route>

                {/* Catch-all for undefined routes (optional) */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}