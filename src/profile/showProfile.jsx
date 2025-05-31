import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/appContext";

// Optional: Import a CSS file for styling
// import './ShowProfile.css';

export default function ShowProfile() {
    const { token, user, setUser } = useContext(AppContext);
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false); 
    const [updateForm, setUpdateForm] = useState({ 
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [updateError, setUpdateError] = useState({}); 
    const [updateSuccess, setUpdateSuccess] = useState(''); 

    // --- Fetch Profile Data ---
    const getProfileData = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError("User not authenticated. Please log in.");
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch the authenticated user's profile
            const response = await fetch('/api/user', { 
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                const fetchedUser = data.user || data;
                setProfileData(fetchedUser);
                setUser(fetchedUser); 

                setUpdateForm({
                    first_name: fetchedUser.first_name || '',
                    last_name: fetchedUser.last_name || '',
                    email: fetchedUser.email || '',
                    password: '', 
                    password_confirmation: '',
                });
            } else {
                setError(data.message || `Failed to fetch user profile (Status: ${response.status}).`);
                if (response.status === 401 || response.status === 403) {
                    alert("Your session has expired or is invalid. Please log in again.");
                    setUser(null);
                    navigate('/login');
                }
            }
        } catch (err) {
            setError('A network error occurred: ' + err.message);
            alert("A network error occurred. Redirecting to login.");
            setUser(null);
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [token, navigate, setUser]);

    useEffect(() => {
        getProfileData();
    }, [getProfileData]);

    // --- Update Profile Data ---
    const handleFormChange = (e) => {
        setUpdateForm({ ...updateForm, [e.target.name]: e.target.value });
        setUpdateError({ ...updateError, [e.target.name]: '' }); // Clear error on change
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setUpdateError({}); // Clear previous errors
        setUpdateSuccess(''); // Clear previous success messages

        if (!profileData || !profileData.id) {
            setUpdateError({ general: "User ID not available for update." });
            return;
        }

        // Basic client-side validation (can be more extensive)
        if (updateForm.password && updateForm.password.length < 8) {
            setUpdateError(prev => ({ ...prev, password: "Password must be at least 8 characters." }));
            return;
        }
        if (updateForm.password !== updateForm.password_confirmation) {
            setUpdateError(prev => ({ ...prev, password_confirmation: "Passwords do not match." }));
            return;
        }
        if (updateForm.email && !/\S+@\S+\.\S+/.test(updateForm.email)) {
            setUpdateError(prev => ({ ...prev, email: "Invalid email format." }));
            return;
        }

        // Prepare data to send: only send fields that have changed or password fields if they are set
        const dataToSend = {};
        if (updateForm.first_name !== profileData.first_name) dataToSend.first_name = updateForm.first_name;
        if (updateForm.last_name !== profileData.last_name) dataToSend.last_name = updateForm.last_name;
        if (updateForm.email !== profileData.email) dataToSend.email = updateForm.email;
        if (updateForm.password) { // Only include password if user typed something
            dataToSend.password = updateForm.password;
            dataToSend.password_confirmation = updateForm.password_confirmation;
        }

        // Don't send empty requests if nothing changed (except password which is special)
        if (Object.keys(dataToSend).length === 0) {
            setUpdateSuccess("No changes detected.");
            setIsEditing(false); // Exit edit mode if nothing changed
            return;
        }


        try {
            const response = await fetch(`/api/users/${profileData.id}`, { // Use PUT/PATCH to update a specific user
                method: 'PUT', // Or 'PATCH' depending on your API
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                setUpdateSuccess(data.message || "Profile updated successfully!");

                getProfileData();
                setIsEditing(false); // Exit edit mode
                setUpdateForm(prev => ({ // Clear password fields after successful update
                    ...prev,
                    password: '',
                    password_confirmation: ''
                }));
            } else {
                // Backend validation errors will be in data.errors
                if (response.status === 422 && data.errors) {
                    setUpdateError(data.errors);
                    setError(data.message || "Validation errors occurred.");
                } else if (response.status === 401 || response.status === 403) {
                    alert("Your session has expired or you are unauthorized. Please log in again.");
                    setUser(null);
                    navigate('/login');
                } else {
                    setError(data.message || 'Failed to update profile.');
                }
            }
        } catch (err) {
            setError('A network error occurred during update: ' + err.message);
        }
    };

    // --- Render Logic ---
    if (loading) {
        return (
            <div className="profile-container">
                <p>Loading your profile details...</p>
            </div>
        );
    }

    if (error && !isEditing) { // Display general fetch error if not in edit mode
        return (
            <div className="profile-container">
                <p className="profile-error">Error: {error}</p>
                <button onClick={() => navigate('/login')}>Go to Login</button>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="profile-container">
                <p className="no-profile-data">No profile data available. Please try logging in again.</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2 className="profile-title">Your Profile</h2>

                {updateSuccess && <p className="profile-success-message">{updateSuccess}</p>}
                {error && <p className="profile-error-message">{error}</p>} {/* Display update-specific errors */}


                {!isEditing ? (
                    // --- View Mode ---
                    <>
                        <div className="profile-detail">
                            <strong className="detail-label">First Name:</strong>
                            <span className="detail-value">{profileData.first_name}</span>
                        </div>

                        <div className="profile-detail">
                            <strong className="detail-label">Last Name:</strong>
                            <span className="detail-value">{profileData.last_name}</span>
                        </div>

                        <div className="profile-detail">
                            <strong className="detail-label">Email:</strong>
                            <span className="detail-value">{profileData.email}</span>
                        </div>

                        <div className="profile-detail">
                            <strong className="detail-label">User Type:</strong>
                            <span className="detail-value">{profileData.user_type}</span>
                        </div>

                        {profileData.created_at && (
                            <div className="profile-detail">
                                <strong className="detail-label">Member Since:</strong>
                                <span className="detail-value">{new Date(profileData.created_at).toLocaleDateString()}</span>
                            </div>
                        )}

                        <div className="profile-actions">
                            <button onClick={() => setIsEditing(true)} className="edit-profile-button">
                                Edit Profile
                            </button>
                        </div>
                    </>
                ) : (
                    // --- Edit Mode ---
                    <form onSubmit={handleUpdateSubmit} className="profile-edit-form">
                        <div className="form-group">
                            <label htmlFor="first_name">First Name:</label>
                            <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={updateForm.first_name}
                                onChange={handleFormChange}
                                className={updateError.first_name ? 'input-error' : ''}
                            />
                            {updateError.first_name && <p className="input-error-text">{updateError.first_name}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="last_name">Last Name:</label>
                            <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={updateForm.last_name}
                                onChange={handleFormChange}
                                className={updateError.last_name ? 'input-error' : ''}
                            />
                            {updateError.last_name && <p className="input-error-text">{updateError.last_name}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email:</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={updateForm.email}
                                onChange={handleFormChange}
                                className={updateError.email ? 'input-error' : ''}
                            />
                            {updateError.email && <p className="input-error-text">{updateError.email}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">New Password (leave blank to keep current):</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={updateForm.password}
                                onChange={handleFormChange}
                                className={updateError.password ? 'input-error' : ''}
                            />
                            {updateError.password && <p className="input-error-text">{updateError.password}</p>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password_confirmation">Confirm New Password:</label>
                            <input
                                type="password"
                                id="password_confirmation"
                                name="password_confirmation"
                                value={updateForm.password_confirmation}
                                onChange={handleFormChange}
                                className={updateError.password_confirmation ? 'input-error' : ''}
                            />
                            {updateError.password_confirmation && <p className="input-error-text">{updateError.password_confirmation}</p>}
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="save-profile-button">Save Changes</button>
                            <button type="button" onClick={() => {
                                setIsEditing(false);
                                // Reset form to current profile data if user cancels
                                if (profileData) {
                                    setUpdateForm({
                                        first_name: profileData.first_name || '',
                                        last_name: profileData.last_name || '',
                                        email: profileData.email || '',
                                        password: '',
                                        password_confirmation: '',
                                    });
                                }
                                setUpdateError({}); // Clear errors on cancel
                                setUpdateSuccess(''); // Clear success message on cancel
                            }} className="cancel-edit-button">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}