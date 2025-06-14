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

    // --- NEW STATES FOR FILTERING AND SORTING ---
    const [filterPriority, setFilterPriority] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('all');
    // --- END NEW STATES ---

    const fetchBookings = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setError("You must be logged in to view bookings.");
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setMessage('');

            // --- CONSTRUCT URL WITH QUERY PARAMETERS ---
            const queryParams = new URLSearchParams();
            if (filterPriority !== 'all') {
                queryParams.append('priority', filterPriority);
            }
            if (sortOrder) {
                queryParams.append('order', sortOrder);
            }
            if (filterStatus !== 'all') {
                queryParams.append('status', filterStatus);
            }
            
            // If you want to add pagination, you can also append page and limit here
            const url = `/api/bookings?${queryParams.toString()}`;

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (res.ok) {
                
                if (data.success) {
                    
                    if (Array.isArray(data.bookings)) {
                        setBookings(data.bookings);
                    } else if (data.data && Array.isArray(data.data.data)) { // For Laravel paginate response
                        setBookings(data.data.data);
                    } else {
                        setError(data.message || "Received unexpected data format for bookings.");
                        setBookings([]);
                    }
                } else {
                    setError(data.message || "Failed to fetch bookings.");
                    setBookings([]);
                }
            } else {
                setError(data.message || "Failed to fetch bookings.");
                console.error("Failed to fetch bookings:", data);

                if (res.status === 401 || res.status === 403) {
                    // Using a modal or notification instead of alert for better UX
                    alert("Your session has expired or is invalid. Please log in again.");
                    setUser(null);
                    navigate('/login');
                }
            }
        } catch (err) {
            setError("An error occurred while fetching bookings. Please check your network connection.");
            console.error("Network or API error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, navigate, setUser, filterPriority, sortOrder, filterStatus]);

    useEffect(() => {
        if (token && user) {
            fetchBookings();
        } else {
            setBookings([]);
            setLoading(false);
            if (!user) {
                setError("Please log in to view bookings.");
            }
        }
    }, [user, token, fetchBookings]);

    const handleStatusUpdate = async (bookingId, newStatus) => {
        if (!user || user.user_type !== 'admin') {
            setMessage("Unauthorized to perform this action.");
            return;
        }

        // Using a custom modal/dialog instead of window.confirm for better UX
        if (!window.confirm(`Are you sure you want to ${newStatus} this booking?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings/${bookingId}/${newStatus}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || `Booking ${newStatus}d successfully!`);
                fetchBookings(); // Re-fetch bookings to update list
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
        if (!user || user.user_type !== 'admin') {
            setMessage("Unauthorized to perform this action.");
            return;
        }

        // Using a custom modal/dialog instead of window.confirm for better UX
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
                fetchBookings(); // Re-fetch bookings to update list
            } else {
                setMessage(data.message || "Failed to delete booking.");
                console.error("Failed to delete booking:", data);
            }
        } catch (err) {
            setMessage("An error occurred while trying to delete the booking.");
            console.error("Network error during delete:", err);
        }
    };

    const handleAdminStatusFilter = (status) => {
        setFilterStatus(status);
    };

    // --- Render Logic ---
    if (loading) {
        return <p className="loading-message">Loading bookings...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

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

            {/* --- ADMIN STATUS FILTER BUTTONS --- */}
            {isAdmin && (
                <div className="admin-status-filters" style={{ marginBottom: '15px' }}>
                    <button
                        onClick={() => handleAdminStatusFilter('all')}
                        className={`status-filter-button ${filterStatus === 'all' ? 'active' : ''}`}
                    >
                        All Bookings
                    </button>
                    <button
                        onClick={() => handleAdminStatusFilter('pending')}
                        className={`status-filter-button ${filterStatus === 'pending' ? 'active' : ''}`}
                    >
                        Pending
                    </button>
                    <button
                        onClick={() => handleAdminStatusFilter('in_use')}
                        className={`status-filter-button ${filterStatus === 'in_use' ? 'active' : ''}`}
                    >
                        In Use
                    </button>
                    <button
                        onClick={() => handleAdminStatusFilter('expired')}
                        className={`status-filter-button ${filterStatus === 'expired' ? 'active' : ''}`}
                    >
                        Expired
                    </button>
                    <button
                        onClick={() => handleAdminStatusFilter('approved')}
                        className={`status-filter-button ${filterStatus === 'approved' ? 'active' : ''}`}
                    >
                        Approved
                    </button>
                     <button
                        onClick={() => handleAdminStatusFilter('cancelled')}
                        className={`status-filter-button ${filterStatus === 'cancelled' ? 'active' : ''}`}
                    >
                        Cancelled
                    </button>
                     <button
                        onClick={() => handleAdminStatusFilter('rejected')}
                        className={`status-filter-button ${filterStatus === 'rejected' ? 'active' : ''}`}
                    >
                        Rejected
                    </button>
                     <button
                        onClick={() => handleAdminStatusFilter('completed')}
                        className={`status-filter-button ${filterStatus === 'rejected' ? 'active' : ''}`}
                    >
                        completed
                    </button>
                </div>
            )}
            {/* --- END ADMIN STATUS FILTER BUTTONS --- */}

            {/* --- FILTER AND SORT CONTROLS --- */}
            <div className="booking-controls">
                <label htmlFor="priority-filter">Filter by Priority:</label>
                <select
                    id="priority-filter"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>

                <label htmlFor="sort-order">Sort Order:</label>
                <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>
            {/* --- END FILTER AND SORT CONTROLS --- */}


            {bookings.length === 0 ? (
                <p className="no-bookings-message">
                    {isAdmin ? "No bookings in the system yet with current filters." : "You have no bookings yet with current filters."}
                </p>
            ) : (
                <div className="bookings-table-wrapper">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                {isAdmin && <th>ID</th>} {/* Only show ID for admin */}
                                <th>Booking Reference</th>
                                <th>Resource</th>
                                {isAdmin && <th>Booked By</th>} {/* Only show Booked By for admin */}
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Purpose</th>
                                {isAdmin && <th>Priority</th>} {/* Only show Priority for admin */}
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.id}>
                                    {isAdmin && <td>{booking.id}</td>} {/* Only show ID for admin */}
                                    <td>{booking.booking_reference || 'N/A'}</td>
                                    <td>
                                        <Link to={`/resources/${booking.resource?.id}`} className="resource-link">
                                            {booking.resource?.name || 'N/A'}
                                        </Link>
                                    </td>
                                    {isAdmin && ( // Only show Booked By for admin
                                        <td>
                                            {booking.user ? (
                                                <>
                                                    {booking.user.first_name} {booking.user.last_name}
                                                    <br />
                                                    <small>{booking.user.email}</small>
                                                </>
                                            ) : 'N/A'}
                                        </td>
                                    )}
                                    <td>{moment(booking.start_time).format('YYYY-MM-DD HH:mm')}</td>
                                    <td>{moment(booking.end_time).format('YYYY-MM-DD HH:mm')}</td>
                                    <td className="purpose">{booking.purpose}</td>
                                    {isAdmin && <td>{booking.priority || 'N/A'}</td>} {/* Only show Priority for admin */}
                                    <td>
                                        <span className={
                                            booking.status === 'approved' ? 'status-approved' :
                                                booking.status === 'pending' ? 'status-pending' :
                                                    booking.status === 'in_use' ? 'status-in-use' :
                                                        booking.status === 'expired' ? 'status-expired' :
                                                            booking.status === 'cancelled' ? 'status-cancelled' : 
                                                                booking.status === 'rejected' ? 'status-rejected' :
                                                                    booking.status === 'completed' ? 'status-completed':
                                                                    'status-default' // Fallback class
                                        }>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="booking-actions-cell">
                                        <Link to={`/booking/${booking.id}`} className="action-button view-button">View</Link>
                                        {(isAdmin || (booking.user_id === user.id && ['pending', 'approved'].includes(booking.status))) && (
                                            <Link to={`/bookings/${booking.id}/edit`} className="action-button edit-button">Edit</Link>
                                        )}

                                        {booking.status === 'pending' && isAdmin && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(booking.id, 'approve')} className="action-button approve-button">Approve</button>
                                                <button onClick={() => handleStatusUpdate(booking.id, 'reject')} className="action-button reject-button">Reject</button>
                                            </>
                                        )}
                                        {/* Allow user to cancel their own pending/approved bookings */}
                                        {(booking.user_id === user.id && ['pending', 'approved'].includes(booking.status)) && (
                                            <button onClick={() => handleStatusUpdate(booking.id, 'cancel')} className="action-button cancel-button">Cancel</button>
                                        )}
                                        {/* Admin can delete any booking, especially useful for rejected/cancelled/expired ones */}
                                        {isAdmin && (
                                            <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}