import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate, useParams } from "react-router-dom";

export default function EditUser() {
    const { id } = useParams();
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        user_type: '',
        role_id: ''
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!token || user?.user_type !== 'admin') {
            setError("You are not authorized to view this page.");
            setTimeout(() => navigate('/'), 2000);
            return;
        }
        fetchUserData();
    }, [id, token, user, navigate]);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/users/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                const fetchedUser = data.user || data;
                setUserData(fetchedUser);
                setFormData({
                    user_type: fetchedUser.user_type || '',
                    role_id: fetchedUser.role_id || ''
                });
            } else {
                throw new Error(data.message || "Failed to fetch user data.");
            }
        } catch (err) {
            console.error("Error fetching user:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');
        setSuccess('');

        if (!window.confirm("Are you sure you want to update this user?")) {
            setUpdating(false);
            return;
        }

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("User updated successfully!");
                setUserData(prev => ({ ...prev, ...formData }));
                setTimeout(() => {
                    navigate('/users');
                }, 1500);
            } else {
                if (data.errors) {
                    setError(Object.values(data.errors).flat().join(', '));
                } else {
                    throw new Error(data.message || `Update failed: ${response.statusText}`);
                }
            }
        } catch (err) {
            console.error("Update error:", err);
            setError(err.message);
        } finally {
            setUpdating(false);
        }
    };

    if (!user || user.user_type !== 'admin') {
        return (
            <div className="container">
                <p className="error-message">{error || "Redirecting..."}</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="container">
                <p>Loading user data...</p>
            </div>
        );
    }

    if (error && !userData) {
        return (
            <div className="container">
                <p className="error-message">Error: {error}</p>
                <button onClick={() => navigate('/users')} className="button">
                    Back to User Management
                </button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="content">
                <div className="header-actions">
                    <h2>Edit User</h2>
                    
                </div>

                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}

                {userData && (
                    <div className="user-info-card">
                        <h3>User Information</h3>
                        <div className="user-details">
                            <p><strong>Name:</strong> {userData.first_name} {userData.last_name}</p>
                            <p><strong>Email:</strong> {userData.email}</p>
                            <p><strong>{userData.user_type === 'student' ? 'Registration Number:' : 'Employee Number:'}
                            </strong> {userData.identity_number}</p>
                            <p><strong>Phone:</strong>  {userData.phone}</p>
                            <p><strong>District:</strong> {userData.district}</p>
                            <p><strong>Village:</strong> {userData.village}</p>
                            <p><strong>Physical Address:</strong> {userData.physical_address}</p>
                            <p><strong>Postal Address:</strong> {userData.post_address}</p>
                           

                            <p><strong>Current User Type:</strong> 
                                <span className={`user-type-${userData.user_type}`}>
                                    {userData.user_type}
                                </span>
                            </p>   

                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-group">
                        <label htmlFor="user_type">User Type:</label>
                        <select
                            id="user_type"
                            name="user_type"
                            value={formData.user_type}
                            onChange={handleInputChange}
                            className="form-select"
                            required
                        >
                            <option value="">Select User Type</option>
                            <option value="student">Student</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                   

                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="button primary-button"
                            disabled={updating}
                        >
                            {updating ? 'Updating...' : 'Update User'}
                        </button>
                        <button 
                            type="button" 
                            onClick={() => navigate('/users')}
                            className="button secondary-button"
                            disabled={updating}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 