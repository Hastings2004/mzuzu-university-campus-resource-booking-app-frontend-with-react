// Settings.jsx
import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/appContext'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ShowProfile() {
    const { user, setUser, token, logout, isDarkMode, toggleTheme } = useContext(AppContext);
    const navigate = useNavigate();

    // State for profile editing
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [identityNumber, setIdentityNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [physicalAddress, setPhysicalAddress] = useState('');
    const [postAddress, setPostAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [village, setVillage] = useState('');
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
    const [showPassword, setShowPassword] = useState(false); 

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setIdentityNumber(user.identity_number || '');
            setPhone(user.phone || '');
            setPhysicalAddress(user.physical_address || '');
            setPostAddress(user.post_address || '');
            setDistrict(user.district || '');
            setVillage(user.village || '');
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
            const response = await fetch('/api/user/profile', { 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    identity_number: identityNumber,
                    phone: phone,
                    physical_address: physicalAddress,
                    post_address: postAddress,
                    district: district,
                    village: village
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update user in context and local storage
                const updatedUser = { 
                    ...user, 
                    first_name: firstName, 
                    last_name: lastName, 
                    email: email,
                    identity_number: identityNumber,
                    phone: phone,
                    physical_address: physicalAddress,
                    post_address: postAddress,
                    district: district,
                    village: village
                };
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
            const response = await fetch('/api/user/password', { 
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    password: newPassword,
                    password_confirmation: confirmNewPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordMessage(data.message || "Password updated successfully!");
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                console.error("Password change failed:", {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                });
                
                // Handle validation errors specifically
                if (response.status === 422 && data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join(', ');
                    setPasswordError(`${errorMessages}`);
                } else {
                    setPasswordError(data.message || "Failed to change password.");
                }
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
        navigate('/login'); 
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
            <h1>Profile</h1>
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
                            readOnly
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
                            readOnly
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
                            readOnly
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="identityNumber">
                            {user?.user_type === 'student' ? 'Registration Number:' : 
                             'Employee Number:' }
                        </label>
                        <input
                            type="text"
                            id="identityNumber"
                            value={identityNumber}
                            onChange={(e) => setIdentityNumber(e.target.value)}
                            maxLength={255}
                            disabled={profileLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Phone:</label>
                        <input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            maxLength={30}
                            disabled={profileLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="physicalAddress">Physical Address:</label>
                        <textarea
                            id="physicalAddress"
                            value={physicalAddress}
                            onChange={(e) => setPhysicalAddress(e.target.value)}
                            disabled={profileLoading}
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="postAddress">Post Address:</label>
                        <textarea
                            id="postAddress"
                            value={postAddress}
                            onChange={(e) => setPostAddress(e.target.value)}
                            disabled={profileLoading}
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="district">District:</label>
                        <input
                            type="text"
                            id="district"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                            maxLength={255}
                            disabled={profileLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="village">Village:</label>
                        <input
                            type="text"
                            id="village"
                            value={village}
                            onChange={(e) => setVillage(e.target.value)}
                            maxLength={255}
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
                            type={showPassword ? "text" : "password"}
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            disabled={passwordLoading}
                        />
                        <span 
                            className="password-toggle-icon" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#666',
                                fontSize: '16px',
                                zIndex: 10
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password:</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={passwordLoading}
                        />
                        <span 
                            className="password-toggle-icon" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#666',
                                fontSize: '16px',
                                zIndex: 10
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmNewPassword">Confirm New Password:</label>
                        <input
                            type={showPassword ? "text" : "password"}   
                            id="confirmNewPassword"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            required
                            disabled={passwordLoading}
                        />
                        <span 
                            className="password-toggle-icon" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'pointer',
                                color: '#666',
                                fontSize: '16px',
                                zIndex: 10
                            }}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                    {passwordMessage && <p className="success-message">{passwordMessage}</p>}
                    {passwordError && <p className="error-message">{passwordError}</p>}
                    <button type="submit" disabled={passwordLoading}>
                        {passwordLoading ? 'Changing...' : 'Change Password'}
                    </button>
                </form>
            </section>

        
            </div>
        </div>
    );
}