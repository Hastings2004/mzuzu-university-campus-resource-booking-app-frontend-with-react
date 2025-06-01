import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../context/appContext";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate for redirects
import moment from 'moment'; // For date formatting

export default function MyBookings() {
    const { user, token, setUser } = useContext(AppContext);
    const navigate = useNavigate(); // Hook for programmatic navigation

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For action success/error messages

    const fetchBookings = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError("You must be logged in to view bookings.");
            // Optionally redirect to login if token is missing
            // navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null); // Clear previous errors
            setMessage(''); // Clear previous messages

            const res = await fetch("/api/bookings", {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (res.ok) {
                setBookings(data);
            } else {
                setError(data.message || "Failed to fetch bookings.");
                console.error("Failed to fetch bookings:", data);
                // If token is invalid/expired, clear user and redirect
                if (res.status === 401 || res.status === 403) {
                    alert("Your session has expired or is invalid. Please log in again.");
                    setUser(null);
                    navigate('/login');
                }
            }
        } catch (err) {
            setError("An error occurred while fetching bookings.");
            console.error("Network or API error:", err);
            // If network error, also consider redirecting
            // alert("A network error occurred. Please check your connection. Redirecting to login.");
            // setUser(null);
            // navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [user, token, navigate, setUser]); // Added user, navigate, setUser to dependencies

    useEffect(() => {
        // Only fetch if user and token are available
        if (user && token) {
            fetchBookings();
        } else {
            // If user or token disappear (e.g., logout), clear bookings and set error
            setBookings([]);
            setLoading(false);
            setError("Please log in to view bookings.");
        }
    }, [user, token, fetchBookings]); // Re-fetch if user, token, or fetchBookings changes

    // --- Action Handlers (Admin Only) ---
    const handleStatusUpdate = async (bookingId, newStatus) => {
        if (!user || user.user_type !== 'admin') {
            setMessage("Unauthorized to perform this action.");
            return;
        }

        if (!window.confirm(`Are you sure you want to ${newStatus} this booking?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings/${bookingId}/${newStatus}`, { // e.g., /api/bookings/1/approve
                method: 'POST', // Assuming your approve/reject endpoints are POST
                headers: {
                    
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || `Booking ${newStatus}d successfully!`);
                fetchBookings(); // Re-fetch bookings to update the table
            } else {
                setMessage(data.message || `Failed to ${newStatus} booking.`);
                console.error(`Failed to ${newStatus} booking:`, data);
            }
        } catch (err) {
            setMessage(`An error occurred while trying to ${newStatus} the booking.`);
            console.error(`Network error during ${newStatus}:`, err);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
        if (!user || user.user_type !== 'admin') { // Only admin can delete
            setMessage("Unauthorized to perform this action.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Booking deleted successfully!");
                fetchBookings(); // Re-fetch bookings to update the table
            } else {
                setMessage(data.message || "Failed to delete booking.");
                console.error("Failed to delete booking:", data);
            }
        } catch (err) {
            setMessage("An error occurred while trying to delete the booking.");
            console.error("Network error during delete:", err);
        }
    };

    // --- Render Logic ---
    if (loading) {
        return <p className="loading-message">Loading bookings...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!user || !user.user_type) {
        return <p className="error-message">User data not available. Please log in.</p>;
    }

    const isAdmin = user.user_type === 'admin';

    return (
        <div className="my-bookings-container">
            <h1 className="my-bookings-title">
                {isAdmin ? "All System Bookings" : "My Bookings"}
            </h1>

            {message && (
                <p className={message.includes('successfully') ? 'success-message' : 'error-message'}>
                    {message}
                </p>
            )}

            {bookings.length === 0 ? (
                <p className="no-bookings-message">
                    {isAdmin ? "No bookings in the system yet." : "You have no bookings yet. Go book some resources!"}
                </p>
            ) : (
                <>
                    {isAdmin ? (
                        // --- Admin Table View ---
                        <div className="bookings-table-wrapper">
                            <table className="bookings-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Resource</th>
                                        <th>Booked By</th>
                                        <th>Start Time</th>
                                        <th>End Time</th>
                                        <th>Purpose</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(booking => (
                                        <tr key={booking.id}>
                                            <td>{booking.id}</td>
                                            <td>
                                                <Link to={`/resources/${booking.resource?.id}`} className="resource-link">
                                                    {booking.resource?.name || 'N/A'}
                                                </Link>
                                            </td>
                                            <td>
                                                {booking.user ? (
                                                    <>
                                                        {booking.user.first_name} {booking.user.last_name}
                                                        <br />
                                                        <small>{booking.user.email}</small>
                                                    </>
                                                ) : 'N/A'}
                                            </td>
                                            <td>{moment(booking.start_time).format('YYYY-MM-DD HH:mm')}</td>
                                            <td>{moment(booking.end_time).format('YYYY-MM-DD HH:mm')}</td>
                                            <td>{booking.purpose}</td>
                                            <td>
                                                <span className={
                                                    booking.status === 'approved' ? 'status-approved' :
                                                    booking.status === 'pending' ? 'status-pending' :
                                                    'status-rejected'
                                                }>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="booking-actions-cell">
                                                <Link to={`/booking/${booking.id}`} className="action-button view-button">View</Link>
                                                <Link to={`/bookings/${booking.id}/edit`} className="action-button edit-button">Edit</Link>
                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleStatusUpdate(booking.id, 'approve')} className="action-button approve-button">Approve</button>
                                                        <button onClick={() => handleStatusUpdate(booking.id, 'reject')} className="action-button reject-button">Reject</button>
                                                    </>
                                                )}
                                                {(booking.status === 'approved' || booking.status === 'rejected' || booking.status === 'cancelled') && (
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button">Delete</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // --- Non-Admin Card View (Existing Layout) ---
                        <div className="bookings-list">
                            {bookings.map(booking => (
                                <div key={booking.id} className="booking-card">
                                    <h2 className="booking-card-title">
                                        {booking.resource ? (
                                            <Link to={`/resources/${booking.resource.id}`} className="resource-link">
                                                {booking.resource.name}
                                            </Link>
                                        ) : (
                                            "Resource Name Not Available"
                                        )}
                                    </h2>
                                    <p className="booking-detail"><strong>Purpose:</strong> {booking.purpose}</p>
                                    <p className="booking-detail"><strong>Start Time:</strong> {new Date(booking.start_time).toLocaleString()}</p>
                                    <p className="booking-detail"><strong>End Time:</strong> {new Date(booking.end_time).toLocaleString()}</p>
                                    <p className="booking-detail"><strong>Booking Status:</strong>
                                        <span className={
                                            booking.status === 'approved' ? 'status-approved' :
                                            booking.status === 'pending' ? 'status-pending' :
                                            'status-rejected'
                                        }>
                                            {booking.status}
                                        </span>
                                    </p>
                                    {/* Conditionally display "Booked by" only for admins (in card view, though table is preferred for admin) */}
                                    {user.user_type === 'admin' && booking.user && (
                                        <div>
                                            <p className="booking-detail"><strong>Booked by:</strong> {booking.user.first_name + " " + booking.user.last_name}</p>
                                            <p className="booking-detail"><strong>Email:</strong> {booking.user.email}</p>
                                        </div>
                                    )}
                                    <Link to={`/my-bookings/${booking.id}`} className="view-details-button">View Details</Link>
                                    {/* You can add more details or action buttons like "Cancel Booking" here */}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}