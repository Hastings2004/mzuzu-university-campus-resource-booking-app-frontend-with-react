import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation

export default function UserManagement() {
    // Destructure user and token from AppContext
    const { user, token } = useContext(AppContext);
    const navigate = useNavigate(); // Initialize useNavigate for redirection

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Memoize fetchUsers with useCallback for better performance and dependency management
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);

        // Client-side authorization check
        if (!user || user.user_type !== 'admin') {
            setError("You are not authorized to view this page.");
            setLoading(false);
            // Optionally redirect non-admin users
            // navigate('/dashboard'); // Or to a login page if not logged in at all
            return;
        }

        if (!token) {
            setError("Authentication token missing. Please log in.");
            setLoading(false);
            // navigate('/login'); // Redirect to login if token is missing
            return;
        }

        try {
            const response = await fetch("/api/users", {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Good practice
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Assuming your backend sends an object like { success: true, users: [...] }
                if (data.success && Array.isArray(data.users)) {
                    setUsers(data.users);
                } else {
                    setError(data.message || "Received unexpected data format from server.");
                    setUsers([]); // Ensure users is an empty array on malformed data
                }
            } else {
                setError(data.message || `Failed to fetch users: ${response.status} ${response.statusText}`);
                console.error("API error:", data);

                // Specific handling for unauthorized access from backend
                if (response.status === 401 || response.status === 403) {
                    // This might happen if the token is invalid/expired or backend denies access
                    // Even if client-side check passed, backend is the ultimate authority
                    alert("Unauthorized access or session expired. Please log in again.");
                    // setUser(null); // Assuming setUser is available in AppContext to clear user state
                    navigate('/login'); // Redirect to login
                }
            }
        } catch (err) {
            setError("An error occurred while fetching users. Please check your network connection.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, token, navigate]); // Add user and navigate to dependencies

    useEffect(() => {
        // Only attempt to fetch if user data and token are available
        if (user && token) {
            fetchUsers();
        } else if (!user) {
            setLoading(false);
            setError("Please log in to view user management.");
            // Optional: redirect immediately if no user is found in context on load
            // navigate('/login');
        }
    }, [user, token, fetchUsers]); // Re-run effect if user, token, or fetchUsers changes

    // Render early if not authorized or if no user object
    if (!user) {
        return <p className="error-message">Loading user data or not logged in...</p>;
    }

    if (user.user_type !== 'admin') {
        return <p className="unauthorized-message">Access Denied: You must be an administrator to view this page.</p>;
    }


    return (
        <div className="user-management">
            <h1>User Management</h1>
            {loading && <p className="loading-message">Loading users...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                users.length > 0 ? (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Email</th>
                                <th>User Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => ( // Renamed 'user' to 'u' to avoid conflict with `user` from useContext
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.first_name}</td>
                                    <td>{u.last_name}</td>
                                    <td>{u.email}</td>
                                    <td><span className={`user-type-${u.user_type}`}>{u.user_type}</span></td>
                                    <td>
                                        <Link 
                                            to={`/users/edit/${u.id}`} 
                                            className="action-link edit-link"
                                        >
                                            View/Edit
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-users-message">No users found in the system.</p>
                )
            )}
        </div>
    );
}