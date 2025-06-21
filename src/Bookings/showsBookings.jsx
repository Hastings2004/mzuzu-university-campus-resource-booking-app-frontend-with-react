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

    // --- NEW STATES FOR PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState(null);
    // --- END NEW STATES ---

    // --- NEW STATES FOR REJECT MODAL ---
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectNotes, setRejectNotes] = useState('');
    const [rejectingBookingId, setRejectingBookingId] = useState(null);
    const [rejectLoading, setRejectLoading] = useState(false);
    // --- END NEW STATES ---

    // --- NEW STATES FOR CANCEL MODAL ---
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelRefundAmount, setCancelRefundAmount] = useState('');
    const [cancelNotes, setCancelNotes] = useState('');
    const [cancellingBookingId, setCancellingBookingId] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    // --- END NEW STATES ---

    const fetchBookings = useCallback(async () => {
        console.log("fetchBookings called with:", { 
            token: !!token, 
            user: !!user, 
            userType: user?.user_type,
            filterPriority, 
            sortOrder, 
            filterStatus,
            currentPage 
        });
        
        if (!token) {
            console.log("No token found, redirecting to login");
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
            
            // Priority filter
            if (filterPriority !== 'all') {
                queryParams.append('priority', filterPriority);
            }
            
            // Status filter - only send for admin users since backend has different logic for regular users
            if (filterStatus !== 'all' && user?.user_type === 'admin') {
                queryParams.append('status', filterStatus);
            }
            
            // Sorting - backend expects 'sort_by' and 'order'
            queryParams.append('sort_by', 'created_at'); // Default sort by created_at
            queryParams.append('order', sortOrder);
            
            // Pagination
            queryParams.append('per_page', '15'); // Match backend default
            queryParams.append('page', currentPage.toString());
            
            const url = `/api/bookings?${queryParams.toString()}`;
            console.log("Making API call to:", url);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log("API response status:", res.status);
            const data = await res.json();
            console.log("API response data:", data);

            if (res.ok) {
                console.log("API call successful, processing data...");
                
                if (data.success) {
                    console.log("Data has success flag, checking bookings array...");
                    
                    // Handle paginated response from Laravel backend
                    if (data.bookings && Array.isArray(data.bookings)) {
                        console.log("Found bookings array with", data.bookings.length, "bookings");
                        setBookings(data.bookings);
                        
                        // Store pagination info if needed for future pagination controls
                        if (data.pagination) {
                            console.log("Pagination info:", data.pagination);
                            setPaginationInfo(data.pagination);
                        }
                    } else {
                        console.log("Unexpected data format:", data);
                        setError(data.message || "Received unexpected data format for bookings.");
                        setBookings([]);
                    }
                } else {
                    console.log("API returned success: false");
                    setError(data.message || "Failed to fetch bookings.");
                    setBookings([]);
                }
            } else {
                console.log("API call failed with status:", res.status);
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
            console.log("Network error occurred:", err);
            setError("An error occurred while fetching bookings. Please check your network connection.");
            console.error("Network or API error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, navigate, setUser, filterPriority, sortOrder, filterStatus, currentPage]);

    useEffect(() => {
        console.log("useEffect triggered with:", { token: !!token, user: !!user, userType: user?.user_type });
        if (token && user) {
            console.log("Token and user exist, calling fetchBookings");
            fetchBookings();
        } else {
            console.log("Token or user missing, clearing bookings");
            setBookings([]);
            setLoading(false);
            if (!user) {
                console.log("No user, setting error");
                setError("Please log in to view bookings.");
            }
        }
    }, [user, token, fetchBookings]);

    // --- NEW FUNCTION FOR HANDLING USER CANCELLATIONS ---
    const handleUserCancel = async (bookingId) => {
        if (!user) {
            setMessage("You must be logged in to perform this action.");
            return;
        }

        // For user cancellations, we might need to use a different endpoint or approach
        // Let's try using a PATCH request to update the status directly
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'cancelled'
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Booking cancelled successfully!");
                fetchBookings(); // Re-fetch bookings to update list
            } else {
                // If PATCH doesn't work, try alternative approach
                console.log("PATCH failed, trying alternative approach:", data);
                
                // Alternative: Try using a different endpoint or method
                const altRes = await fetch(`/api/bookings/${bookingId}/user-cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const altData = await altRes.json();

                if (altRes.ok) {
                    setMessage(altData.message || "Booking cancelled successfully!");
                    fetchBookings();
                } else {
                    setMessage(altData.message || "Failed to cancel booking. Please contact support.");
                    console.error("Alternative cancel approach failed:", altData);
                }
            }
        } catch (err) {
            setMessage("An error occurred while trying to cancel the booking.");
            console.error("Network error during user cancel:", err);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        // Check if user is logged in
        if (!user) {
            setMessage("You must be logged in to perform this action.");
            return;
        }

        // Admin-only actions
        if (['approve', 'reject'].includes(newStatus)) {
            if (user.user_type !== 'admin') {
                setMessage("Unauthorized to perform this action.");
                return;
            }
        }

        // Special handling for reject - show modal instead of direct action (admin only)
        if (newStatus === 'reject') {
            setRejectingBookingId(bookingId);
            setShowRejectModal(true);
            return;
        }

        // Special handling for cancel - show modal for admin cancellations
        if (newStatus === 'cancel' && user.user_type === 'admin') {
            setCancellingBookingId(bookingId);
            setShowCancelModal(true);
            return;
        }

        // Special handling for user cancellations
        if (newStatus === 'cancel' && user.user_type !== 'admin') {
            handleUserCancel(bookingId);
            return;
        }

        // For other actions, use simple confirmation
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

    // --- NEW FUNCTION FOR HANDLING REJECT SUBMISSION ---
    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) {
            setMessage("Rejection reason is required.");
            return;
        }

        setRejectLoading(true);
        try {
            const res = await fetch(`/api/bookings/${rejectingBookingId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason: rejectReason.trim(),
                    notes: rejectNotes.trim() || null
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Booking rejected successfully!");
                setShowRejectModal(false);
                setRejectReason('');
                setRejectNotes('');
                setRejectingBookingId(null);
                fetchBookings(); // Re-fetch bookings to update list
            } else {
                if (data.errors) {
                    // Handle validation errors
                    const errorMessages = Object.values(data.errors).flat().join(', ');
                    setMessage(`Validation failed: ${errorMessages}`);
                } else {
                    setMessage(data.message || "Failed to reject booking.");
                }
                console.error("Failed to reject booking:", data);
            }
        } catch (err) {
            setMessage("An error occurred while trying to reject the booking.");
            console.error("Network error during reject:", err);
        } finally {
            setRejectLoading(false);
        }
    };

    // --- NEW FUNCTION FOR HANDLING CANCEL SUBMISSION ---
    const handleCancelSubmit = async () => {
        if (!cancelReason.trim()) {
            setMessage("Cancellation reason is required.");
            return;
        }

        setCancelLoading(true);
        try {
            const requestBody = {
                reason: cancelReason.trim(),
                notes: cancelNotes.trim() || null
            };

            // Add refund amount if provided
            if (cancelRefundAmount.trim()) {
                const refundAmount = parseFloat(cancelRefundAmount);
                if (isNaN(refundAmount) || refundAmount < 0) {
                    setMessage("Refund amount must be a valid positive number.");
                    setCancelLoading(false);
                    return;
                }
                requestBody.refund_amount = refundAmount;
            }

            const res = await fetch(`/api/bookings/${cancellingBookingId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(data.message || "Booking cancelled successfully!");
                setShowCancelModal(false);
                setCancelReason('');
                setCancelRefundAmount('');
                setCancelNotes('');
                setCancellingBookingId(null);
                fetchBookings(); // Re-fetch bookings to update list
            } else {
                if (data.errors) {
                    // Handle validation errors
                    const errorMessages = Object.values(data.errors).flat().join(', ');
                    setMessage(`Validation failed: ${errorMessages}`);
                } else {
                    setMessage(data.message || "Failed to cancel booking.");
                }
                console.error("Failed to cancel booking:", data);
            }
        } catch (err) {
            setMessage("An error occurred while trying to cancel the booking.");
            console.error("Network error during cancel:", err);
        } finally {
            setCancelLoading(false);
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
        setCurrentPage(1); // Reset to first page when filter changes
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

            {/* Report Issue Link for Non-Admin Users */}
            {!isAdmin && (
                <div style={{ marginBottom: '20px', textAlign: 'right' }}>
                    <Link 
                        to="/reportIssueForm" 
                        style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            backgroundColor: 'var(--primary-color, #007bff)',
                            color: 'var(--text-light-on-dark, white)',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'var(--primary-color-dark, #0056b3)';
                            e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--primary-color, #007bff)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        📋 Report an Issue
                    </Link>
                </div>
            )}

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
                        className={`status-filter-button ${filterStatus === 'completed' ? 'active' : ''}`}
                    >
                        Completed
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
                    onChange={(e) => {
                        setFilterPriority(e.target.value);
                        setCurrentPage(1); // Reset to first page when filter changes
                    }}
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
                    onChange={(e) => {
                        setSortOrder(e.target.value);
                        setCurrentPage(1); // Reset to first page when sort changes
                    }}
                >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
            </div>
            {/* --- END FILTER AND SORT CONTROLS --- */}

            {/* --- REJECT MODAL --- */}
            {showRejectModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.5))',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'var(--bg-light)',
                        color: 'var(--text-primary)',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 20px var(--shadow-medium)'
                    }}>
                        <h3 style={{ 
                            color: 'var(--text-primary)', 
                            marginBottom: '15px',
                            borderBottom: '2px solid var(--border-color)',
                            paddingBottom: '10px'
                        }}>Reject Booking</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Please provide a reason for rejecting this booking:
                        </p>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="reject-reason" style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: 'var(--text-primary)'
                            }}>
                                Reason: <span style={{ color: 'var(--accent-red)' }}>*</span>
                            </label>
                            <textarea
                                id="reject-reason"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Enter the reason for rejection..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    resize: 'vertical',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                                maxLength={500}
                                required
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary-color)';
                                    e.target.style.boxShadow = '0 0 0 2px var(--primary-color-light)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="reject-notes" style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: 'var(--text-primary)'
                            }}>
                                Additional Notes (Optional):
                            </label>
                            <textarea
                                id="reject-notes"
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder="Any additional notes or comments..."
                                style={{
                                    width: '100%',
                                    minHeight: '60px',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    resize: 'vertical',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                                maxLength={500}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary-color)';
                                    e.target.style.boxShadow = '0 0 0 2px var(--primary-color-light)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setRejectNotes('');
                                    setRejectingBookingId(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    cursor: rejectLoading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    opacity: rejectLoading ? 0.6 : 1
                                }}
                                disabled={rejectLoading}
                                onMouseEnter={(e) => {
                                    if (!rejectLoading) {
                                        e.target.style.backgroundColor = 'var(--bg-hover)';
                                        e.target.style.borderColor = 'var(--primary-color)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!rejectLoading) {
                                        e.target.style.backgroundColor = 'var(--bg-light)';
                                        e.target.style.borderColor = 'var(--border-color)';
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--accent-red)',
                                    color: 'var(--text-light-on-dark)',
                                    cursor: rejectLoading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    opacity: rejectLoading ? 0.7 : 1
                                }}
                                disabled={rejectLoading}
                                onMouseEnter={(e) => {
                                    if (!rejectLoading) {
                                        e.target.style.backgroundColor = 'var(--accent-red-dark, #c82333)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!rejectLoading) {
                                        e.target.style.backgroundColor = 'var(--accent-red)';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {rejectLoading ? 'Rejecting...' : 'Reject Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- END REJECT MODAL --- */}

            {/* --- CANCEL MODAL --- */}
            {showCancelModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--modal-overlay-bg, rgba(0, 0, 0, 0.5))',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'var(--bg-light)',
                        color: 'var(--text-primary)',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 20px var(--shadow-medium)'
                    }}>
                        <h3 style={{ 
                            color: 'var(--text-primary)', 
                            marginBottom: '15px',
                            borderBottom: '2px solid var(--border-color)',
                            paddingBottom: '10px'
                        }}>Cancel Booking</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            Please provide a reason for cancelling this booking:
                        </p>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="cancel-reason" style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: 'var(--text-primary)'
                            }}>
                                Reason: <span style={{ color: 'var(--accent-red)' }}>*</span>
                            </label>
                            <textarea
                                id="cancel-reason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Enter the reason for cancellation..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    resize: 'vertical',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                                maxLength={500}
                                required
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary-color)';
                                    e.target.style.boxShadow = '0 0 0 2px var(--primary-color-light)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="cancel-refund-amount" style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: 'var(--text-primary)'
                            }}>
                                Refund Amount (Optional):
                            </label>
                            <input
                                id="cancel-refund-amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={cancelRefundAmount}
                                onChange={(e) => setCancelRefundAmount(e.target.value)}
                                placeholder="Enter the refund amount..."
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary-color)';
                                    e.target.style.boxShadow = '0 0 0 2px var(--primary-color-light)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="cancel-notes" style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: 'var(--text-primary)'
                            }}>
                                Additional Notes (Optional):
                            </label>
                            <textarea
                                id="cancel-notes"
                                value={cancelNotes}
                                onChange={(e) => setCancelNotes(e.target.value)}
                                placeholder="Any additional notes or comments..."
                                style={{
                                    width: '100%',
                                    minHeight: '60px',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    resize: 'vertical',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                }}
                                maxLength={500}
                                onFocus={(e) => {
                                    e.target.style.borderColor = 'var(--primary-color)';
                                    e.target.style.boxShadow = '0 0 0 2px var(--primary-color-light)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = 'var(--border-color)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setCancelRefundAmount('');
                                    setCancelNotes('');
                                    setCancellingBookingId(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    opacity: cancelLoading ? 0.6 : 1
                                }}
                                disabled={cancelLoading}
                                onMouseEnter={(e) => {
                                    if (!cancelLoading) {
                                        e.target.style.backgroundColor = 'var(--bg-hover)';
                                        e.target.style.borderColor = 'var(--primary-color)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!cancelLoading) {
                                        e.target.style.backgroundColor = 'var(--bg-light)';
                                        e.target.style.borderColor = 'var(--border-color)';
                                    }
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCancelSubmit}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--accent-red)',
                                    color: 'var(--text-light-on-dark)',
                                    cursor: cancelLoading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    opacity: cancelLoading ? 0.7 : 1
                                }}
                                disabled={cancelLoading}
                                onMouseEnter={(e) => {
                                    if (!cancelLoading) {
                                        e.target.style.backgroundColor = 'var(--accent-red-dark, #c82333)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!cancelLoading) {
                                        e.target.style.backgroundColor = 'var(--accent-red)';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {cancelLoading ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- END CANCEL MODAL --- */}

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

            {/* --- PAGINATION CONTROLS --- */}
            {paginationInfo && paginationInfo.last_page > 1 && (
                <div className="pagination-controls" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)'
                }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: currentPage === 1 ? 'var(--bg-disabled)' : 'var(--bg-light)',
                            color: currentPage === 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (currentPage !== 1) {
                                e.target.style.backgroundColor = 'var(--bg-hover)';
                                e.target.style.borderColor = 'var(--primary-color)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentPage !== 1) {
                                e.target.style.backgroundColor = 'var(--bg-light)';
                                e.target.style.borderColor = 'var(--border-color)';
                            }
                        }}
                    >
                        Previous
                    </button>

                    <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}>
                        Page {currentPage} of {paginationInfo.last_page}
                    </span>

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(paginationInfo.last_page, prev + 1))}
                        disabled={currentPage === paginationInfo.last_page}
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            backgroundColor: currentPage === paginationInfo.last_page ? 'var(--bg-disabled)' : 'var(--bg-light)',
                            color: currentPage === paginationInfo.last_page ? 'var(--text-disabled)' : 'var(--text-primary)',
                            cursor: currentPage === paginationInfo.last_page ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (currentPage !== paginationInfo.last_page) {
                                e.target.style.backgroundColor = 'var(--bg-hover)';
                                e.target.style.borderColor = 'var(--primary-color)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentPage !== paginationInfo.last_page) {
                                e.target.style.backgroundColor = 'var(--bg-light)';
                                e.target.style.borderColor = 'var(--border-color)';
                            }
                        }}
                    >
                        Next
                    </button>

                    <span style={{
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        marginLeft: '15px'
                    }}>
                        Showing {paginationInfo.from || 0} to {paginationInfo.to || 0} of {paginationInfo.total || 0} bookings
                    </span>
                </div>
            )}
            {/* --- END PAGINATION CONTROLS --- */}
        </div>
    );
}