import { useContext, useEffect, useState, useCallback } from "react";
import { AppContext } from "../context/appContext";
import { Link, useNavigate } from "react-router-dom";
import moment from 'moment';

export default function MyBookings() {
    const { user, token, setUser } = useContext(AppContext);
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    const fetchBookings = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError("You must be logged in to view bookings.");
            // Consider redirecting to login if token is definitely missing and this page requires it
            // navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setMessage('');

            const res = await fetch("/api/bookings", {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json(); // Data will be { success: true, bookings: [...] }

            if (res.ok) {
                // *** IMPORTANT FIX HERE ***
                if (data.success && Array.isArray(data.bookings)) {
                    setBookings(data.bookings); // Set the actual array of bookings
                } else {
                    // Handle unexpected success response structure
                    setError(data.message || "Received unexpected data format for bookings.");
                    setBookings([]); // Clear bookings if data is malformed
                }
            } else {
                setError(data.message || "Failed to fetch bookings.");
                console.error("Failed to fetch bookings:", data);

                if (res.status === 401 || res.status === 403) {
                    alert("Your session has expired or is invalid. Please log in again.");
                    setUser(null); // Clear user context
                    navigate('/login'); // Redirect to login
                }
            }
        } catch (err) {
            setError("An error occurred while fetching bookings. Please check your network connection.");
            console.error("Network or API error:", err);
            // Optionally redirect on severe network error
            // alert("A network error occurred. Please check your connection. Redirecting to login.");
            // setUser(null);
            // navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [token, navigate, setUser]); // user is not directly used within fetchBookings, but token is

    useEffect(() => {
        // Only fetch if user and token are available, and after initial render
        if (token && user) { // Ensure user object is also available
            fetchBookings();
        } else {
            setBookings([]);
            setLoading(false);
            // Only set error if no user or token, otherwise fetchBookings handles it
            if (!user) {
                setError("Please log in to view bookings.");
            }
        }
    }, [user, token, fetchBookings]); // Re-fetch if user, token, or fetchBookings changes

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
                    'Accept': 'application/json', // Good practice
                    'Content-Type': 'application/json', // If sending a body, though not needed for these
                    'Authorization': `Bearer ${token}`
                },
                // No body needed for these simple status updates if your backend just uses URL params
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
        if (!user || user.user_type !== 'admin') { // Only admin can delete based on your logic
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
                    'Accept': 'application/json',
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

    // This check is important as `user` might be null initially or after logout
    if (!user || !user.user_type) {
        return <p className="error-message">User data not available or not logged in. Please log in.</p>;
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
                                                {/* Edit button for admin or owner if pending/approved */}
                                                {(isAdmin || (booking.user_id === user.id && ['pending', 'approved'].includes(booking.status))) && (
                                                    <Link to={`/bookings/${booking.id}/edit`} className="action-button edit-button">Edit</Link>
                                                )}

                                                {booking.status === 'pending' && isAdmin && (
                                                    <>
                                                        <button onClick={() => handleStatusUpdate(booking.id, 'approve')} className="action-button approve-button">Approve</button>
                                                        <button onClick={() => handleStatusUpdate(booking.id, 'reject')} className="action-button reject-button">Reject</button>
                                                    </>
                                                )}
                                                {/* Allow delete for admin, or for owner if status is specific (e.g., pending, rejected, cancelled) */}
                                                {(isAdmin || (booking.user_id === user.id && ['pending', 'rejected', 'cancelled'].includes(booking.status))) && (
                                                    <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button">Delete</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // --- Non-Admin Card View ---
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
                                    <p className="booking-detail"><strong>Start Time:</strong> {moment(booking.start_time).format('YYYY-MM-DD HH:mm')}</p>
                                    <p className="booking-detail"><strong>End Time:</strong> {moment(booking.end_time).format('YYYY-MM-DD HH:mm')}</p>
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
                                    {isAdmin && booking.user && ( // Only show if admin and user data exists
                                        <div>
                                            <p className="booking-detail"><strong>Booked by:</strong> {booking.user.first_name + " " + booking.user.last_name}</p>
                                            <p className="booking-detail"><strong>Email:</strong> {booking.user.email}</p>
                                        </div>
                                    )}
                                    <Link to={`/my-bookings/${booking.id}`} className="view-details-button">View Details</Link>
                                    
                                    {(booking.user_id === user.id && ['pending', 'approved'].includes(booking.status)) && (
                                        <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button">Cancel Booking</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}