// Settings.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/appContext'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';


export default function Settings() {
    const { user, setUser, token, logout, isDarkMode, toggleTheme } = useContext(AppContext);
    const navigate = useNavigate();

    // State for profile editing
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [profileMessage, setProfileMessage] = useState('');
    const [profileError, setProfileError] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    // State for password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMessage('');
        setProfileError('');

        if (!token) {
            setProfileError("Authentication required. Please log in.");
            setProfileLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/user/profile', { // Your API endpoint for profile updates
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update user in context and local storage
                const updatedUser = { ...user, first_name: firstName, last_name: lastName, email: email };
                setUser(updatedUser); // Update context
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
                setProfileMessage(data.message || "Profile updated successfully!");
            } else {
                setProfileError(data.message || "Failed to update profile.");
            }
        } catch (err) {
            console.error("Profile update error:", err);
            setProfileError("An error occurred during profile update. Please try again.");
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordLoading(true);
        setPasswordMessage('');
        setPasswordError('');

        if (!token) {
            setPasswordError("Authentication required. Please log in.");
            setPasswordLoading(false);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError("New passwords do not match.");
            setPasswordLoading(false);
            return;
        }
        if (newPassword.length < 8) { // Basic validation
            setPasswordError("New password must be at least 8 characters long.");
            setPasswordLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/user/password', { // Your API endpoint for password change
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmNewPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordMessage(data.message || "Password updated successfully!");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                setPasswordError(data.message || "Failed to change password.");
            }
        } catch (err) {
            console.error("Password change error:", err);
            setPasswordError("An error occurred during password change. Please try again.");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login page after logout
    };

    if (!user) {
        return (
            <div className="settings-container">
                <p className="loading-message">Please log in to view settings.</p>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <h1>Settings</h1>
            <div className='settings-items'>
                
            {/* Profile Settings */}
            <section className="settings-section">
                <h2>Profile Information</h2>
                <form onSubmit={handleProfileUpdate} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="firstName">First Name:</label>
                        <input
                            type="text"
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={profileLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">Last Name:</label>
                        <input
                            type="text"
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={profileLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={profileLoading}
                        />
                    </div>
                    {profileMessage && <p className="success-message">{profileMessage}</p>}
                    {profileError && <p className="error-message">{profileError}</p>}
                    <button type="submit" disabled={profileLoading}>
                        {profileLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </section>

            {/* Password Change */}
            <section className="settings-section">
                <h2>Change Password</h2>
                <form onSubmit={handlePasswordChange} className="settings-form">
                    <div className="form-group">
                        <label htmlFor="currentPassword">Current Password:</label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            disabled={passwordLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password:</label>
                        <input
                            type="password"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={passwordLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                        <input
                            type="password"
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            disabled={passwordLoading}
                        />
                    </div>
                    {passwordMessage && <p className="success-message">{passwordMessage}</p>}
                    {passwordError && <p className="error-message">{passwordError}</p>}
                    <button type="submit" disabled={passwordLoading}>
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </section>

            

            {/* Logout Section */}
            <section className="settings-section">
                <h2>Account Actions</h2>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </section>
            </div>
        </div>
    );
}