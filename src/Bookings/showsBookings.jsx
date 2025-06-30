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
    

    // --- NEW STATES FOR APPROVE MODAL ---
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveNotes, setApproveNotes] = useState('');
    const [approvingBookingId, setApprovingBookingId] = useState(null);
    const [approveLoading, setApproveLoading] = useState(false);
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

            const queryParams = new URLSearchParams();
            
            if (filterPriority !== 'all') {
                queryParams.append('priority', filterPriority);
            }
            
            // Status filter - only send for admin users since backend has different logic for regular users
            if (filterStatus !== 'all' && user?.user_type === 'admin') {
                queryParams.append('status', filterStatus);
            }
            
            queryParams.append('sort_by', 'created_at');
            queryParams.append('order', sortOrder);
            
            queryParams.append('per_page', '15');
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

        // Let's try using a PATCH request to update the status directly
        if (!window.confirm("Are you sure you want to cancel this booking?")) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings/${bookingId}`, {
                method: 'POST',
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
                fetchBookings();
            } else {
                console.log("PATCH failed, trying alternative approach:", data);
                
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

    // --- NEW FUNCTION FOR HANDLING DOCUMENT DOWNLOADS ---
    const handleDocumentDownload = async (bookingId, event) => {
        event.preventDefault();
        
        if (!user) {
            setMessage("You must be logged in to download documents.");
            return;
        }

        try {
            // Use the download endpoint
            const res = await fetch(`/api/bookings/${bookingId}/download-document`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (res.ok) {
                // Get the blob from the response
                const blob = await res.blob();
                
                // Create a download link
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                
                // Extract filename from response headers or use default
                const contentDisposition = res.headers.get('content-disposition');
                let filename = 'document.pdf';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                setMessage("Document downloaded successfully!");
            } else if (res.status === 404) {
                setMessage("Document download feature is not yet available");
                console.warn("Document download API endpoint not implemented yet");
            } else {
                const data = await res.json();
                setMessage(data.message || "Failed to download document.");
                console.error("Failed to download document:", data);
            }
        } catch (err) {
            setMessage("An error occurred while downloading the document.");
            console.error("Network error during document download:", err);
        }
    };

    // --- NEW FUNCTION FOR HANDLING DOCUMENT VIEWING ---
    const handleDocumentView = async (bookingId, event) => {
        event.preventDefault();
        
        if (!user) {
            setMessage("You must be logged in to view documents.");
            return;
        }

        try {
            // First, try to fetch the document with authentication
            const res = await fetch(`/api/bookings/${bookingId}/document`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    //'Accept': 'application/json'
                }
            });

            if (res.ok) {
                // Get the blob from the response
                const blob = await res.blob();
                
                // Create a URL for the blob
                const url = window.URL.createObjectURL(blob);
                
                // Open in new tab
                window.open(url, '_blank');
                
                // Clean up the URL after a delay
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                }, 1000);
                
            } else if (res.status === 404) {
                // API endpoint doesn't exist yet - show fallback message
                setMessage("Document view feature is not yet available. Please contact the administrator.");
                console.warn("Document view API endpoint not implemented yet");
            } else if (res.status === 401) {
                setMessage("Authentication failed. Please log in again.");
                console.error("Authentication error when viewing document");
            } else {
                const data = await res.json();
                setMessage(data.message || "Failed to view document.");
                console.error("Failed to view document:", data);
            }
        } catch (err) {
            setMessage("An error occurred while opening the document.");
            console.error("Network error during document view:", err);
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

        // Special handling for approve - show modal for admin approvals
        if (newStatus === 'approve' && user.user_type === 'admin') {
            setApprovingBookingId(bookingId);
            setShowApproveModal(true);
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
            // First, get the current booking data to include all required fields
            console.log(`Fetching current booking data for ${bookingId}...`);
            const getBookingRes = await fetch(`/api/bookings/${bookingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!getBookingRes.ok) {
                throw new Error(`Failed to fetch booking data: ${getBookingRes.status}`);
            }

            const bookingData = await getBookingRes.json();
            const currentBooking = bookingData.booking || bookingData.data || bookingData;

            console.log('Current booking data:', currentBooking);

            // Prepare the update data with all required fields plus the new status
            const updateData = {
                resource_id: currentBooking.resource_id || currentBooking.resource?.id,
                user_id: currentBooking.user_id || currentBooking.user?.id,
                start_time: currentBooking.start_time,
                end_time: currentBooking.end_time,
                purpose: currentBooking.purpose,
                booking_type: currentBooking.booking_type,
                status: newStatus === 'approve' ? 'approved' : newStatus === 'in_use' ? 'in_use' : newStatus
            };

            // Add optional fields if they exist
            if (currentBooking.priority) {
                updateData.priority = currentBooking.priority;
            }
            if (currentBooking.supporting_document) {
                updateData.supporting_document = currentBooking.supporting_document;
            }

            console.log(`Updating booking ${bookingId} with data:`, updateData);

            // Try the specific action endpoint first
            let res = await fetch(`/api/bookings/${bookingId}/${newStatus}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            let data = await res.json();

            // If that fails, try updating the booking directly
            if (!res.ok) {
                console.log("Action endpoint failed, trying direct update...");
                
                res = await fetch(`/api/bookings/${bookingId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                data = await res.json();
            }

            if (res.ok) {
                setMessage(data.message || `Booking ${newStatus}d successfully!`);
                fetchBookings(); // Re-fetch bookings to update list
            } else {
                // Enhanced error handling
                let errorMessage = `Failed to ${newStatus} booking.`;
                
                if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (data.errors) {
                    // Handle validation errors
                    const errorMessages = Object.values(data.errors).flat().join(', ');
                    errorMessage = `Validation failed: ${errorMessages}`;
                }
                
                setMessage(errorMessage);
                console.error(`Failed to ${newStatus} booking:`, {
                    status: res.status,
                    statusText: res.statusText,
                    data: data
                });
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
            console.log(`Attempting to reject booking ${rejectingBookingId}...`);

            // Try multiple approaches with different data formats
            const approaches = [
                // Approach 1: Simple rejection data
                {
                    name: "Simple rejection data",
                    data: {
                        reason: rejectReason.trim(),
                        notes: rejectNotes.trim() || null
                    }
                },
                // Approach 2: Alternative field names
                {
                    name: "Alternative field names",
                    data: {
                        rejection_reason: rejectReason.trim(),
                        rejection_notes: rejectNotes.trim() || null
                    }
                },
                // Approach 3: With status
                {
                    name: "With status",
                    data: {
                        status: 'rejected',
                        reason: rejectReason.trim(),
                        notes: rejectNotes.trim() || null
                    }
                }
            ];

            let success = false;
            let lastError = null;

            for (const approach of approaches) {
                console.log(`Trying approach: ${approach.name}`, approach.data);
                
                try {
                    const res = await fetch(`/api/bookings/${rejectingBookingId}/reject`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(approach.data)
                    });

                    const data = await res.json();
                    console.log(`Response for ${approach.name}:`, { status: res.status, data });

                    if (res.ok) {
                        setMessage(data.message || "Booking rejected successfully!");
                        setShowRejectModal(false);
                        setRejectReason('');
                        setRejectNotes('');
                        setRejectingBookingId(null);
                        fetchBookings();
                        success = true;
                        break;
                    } else {
                        lastError = { status: res.status, data };
                    }
                } catch (err) {
                    console.error(`Error with ${approach.name}:`, err);
                    lastError = { error: err.message };
                }
            }

            if (!success) {
                // If all approaches fail, show the last error
                let errorMessage = "Failed to reject booking.";
                
                if (lastError.data?.message) {
                    errorMessage = lastError.data.message;
                } else if (lastError.data?.error) {
                    errorMessage = lastError.data.error;
                } else if (lastError.data?.errors) {
                    const errorMessages = Object.values(lastError.data.errors).flat().join(', ');
                    errorMessage = `Validation failed: ${errorMessages}`;
                }
                
                setMessage(errorMessage);
                console.error("All reject approaches failed:", lastError);
            }
        } catch (err) {
            setMessage("An error occurred while trying to reject the booking.");
            console.error("Network error during reject:", err);
        } finally {
            setRejectLoading(false);
        }
    };

    // --- NEW FUNCTION FOR HANDLING APPROVE SUBMISSION ---
    const handleApproveSubmit = async () => {
        setApproveLoading(true);
        try {
            // First, get the current booking data to include all required fields
            console.log(`Fetching current booking data for ${approvingBookingId}...`);
            const getBookingRes = await fetch(`/api/bookings/${approvingBookingId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!getBookingRes.ok) {
                throw new Error(`Failed to fetch booking data: ${getBookingRes.status}`);
            }

            const bookingData = await getBookingRes.json();
            const currentBooking = bookingData.booking || bookingData.data || bookingData;

            console.log('Current booking data:', currentBooking);

            // Prepare the update data with all required fields plus the new status
            const updateData = {
                resource_id: currentBooking.resource_id || currentBooking.resource?.id,
                user_id: currentBooking.user_id || currentBooking.user?.id,
                start_time: currentBooking.start_time,
                end_time: currentBooking.end_time,
                purpose: currentBooking.purpose,
                booking_type: currentBooking.booking_type,
                status: 'approved',
                approval_notes: approveNotes.trim() || null
            };

            // Add optional fields if they exist
            if (currentBooking.priority) {
                updateData.priority = currentBooking.priority;
            }
            if (currentBooking.supporting_document) {
                updateData.supporting_document = currentBooking.supporting_document;
            }

            console.log(`Approving booking ${approvingBookingId} with data:`, updateData);

            // Try the specific action endpoint first
            let res = await fetch(`/api/bookings/${approvingBookingId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            let data = await res.json();

            // If that fails, try updating the booking directly
            if (!res.ok) {
                console.log("Action endpoint failed, trying direct update...");
                
                res = await fetch(`/api/bookings/${approvingBookingId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                });
                data = await res.json();
            }

            if (res.ok) {
                setMessage(data.message || "Booking approved successfully!");
                setShowApproveModal(false);
                setApproveNotes('');
                setApprovingBookingId(null);
                fetchBookings(); // Re-fetch bookings to update list
            } else {
                // Enhanced error handling
                let errorMessage = "Failed to approve booking.";
                
                if (data.message) {
                    errorMessage = data.message;
                } else if (data.error) {
                    errorMessage = data.error;
                } else if (data.errors) {
                    // Handle validation errors
                    const errorMessages = Object.values(data.errors).flat().join(', ');
                    errorMessage = `Validation failed: ${errorMessages}`;
                }
                
                setMessage(errorMessage);
                console.error("Failed to approve booking:", {
                    status: res.status,
                    statusText: res.statusText,
                    data: data
                });
            }
        } catch (err) {
            setMessage("An error occurred while trying to approve the booking.");
            console.error("Network error during approve:", err);
        } finally {
            setApproveLoading(false);
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
                {isAdmin ? "All Bookings" : "My Bookings"}
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

            {/* --- APPROVE MODAL --- */}
            {showApproveModal && (
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
                        }}>Approve Booking</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                            You can add optional notes that will be sent to the user via email:
                        </p>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <label htmlFor="approve-notes" style={{ 
                                display: 'block', 
                                marginBottom: '5px', 
                                fontWeight: 'bold',
                                color: 'var(--text-primary)'
                            }}>
                                Approval Notes (Optional):
                            </label>
                            <textarea
                                id="approve-notes"
                                value={approveNotes}
                                onChange={(e) => setApproveNotes(e.target.value)}
                                placeholder="Add any notes or instructions for the user..."
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
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
                            <small style={{ 
                                color: 'var(--text-secondary)', 
                                fontSize: '12px',
                                marginTop: '5px',
                                display: 'block'
                            }}>
                                These notes will be included in the approval email sent to the user.
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setApproveNotes('');
                                    setApprovingBookingId(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-light)',
                                    color: 'var(--text-primary)',
                                    cursor: approveLoading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    opacity: approveLoading ? 0.6 : 1
                                }}
                                disabled={approveLoading}
                                onMouseEnter={(e) => {
                                    if (!approveLoading) {
                                        e.target.style.backgroundColor = 'var(--bg-hover)';
                                        e.target.style.borderColor = 'var(--primary-color)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!approveLoading) {
                                        e.target.style.backgroundColor = 'var(--bg-light)';
                                        e.target.style.borderColor = 'var(--border-color)';
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveSubmit}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--accent-green, #28a745)',
                                    color: 'var(--text-light-on-dark)',
                                    cursor: approveLoading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'var(--lato, inherit)',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    transition: 'all 0.2s ease',
                                    opacity: approveLoading ? 0.7 : 1
                                }}
                                disabled={approveLoading}
                                onMouseEnter={(e) => {
                                    if (!approveLoading) {
                                        e.target.style.backgroundColor = 'var(--accent-green-dark, #1e7e34)';
                                        e.target.style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!approveLoading) {
                                        e.target.style.backgroundColor = 'var(--accent-green, #28a745)';
                                        e.target.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {approveLoading ? 'Approving...' : 'Approve Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- END APPROVE MODAL --- */}

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
                <div className="bookings-table-wrapper" style={{
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'visible',
                    maxWidth: '100%',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px var(--shadow-light)',
                    marginBottom: '20px'
                }}>
                    <table className="bookings-table" style={{
                        width: '100%',
                        minWidth: '1200px',
                        borderCollapse: 'collapse',
                        backgroundColor: 'var(--bg-light)',
                        fontSize: '14px',
                        tableLayout: 'fixed'
                    }}>
                        <thead>
                            <tr style={{
                                backgroundColor: 'green',
                                color: 'white',
                                fontWeight: '600'
                            }}>
                                
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '120px', width: '120px' }}>Booking Reference</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '150px', width: '150px' }}>Resource</th>
                                {isAdmin && <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '180px', width: '180px' }}>Booked By</th>}
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '140px', width: '140px' }}>Start Time</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '140px', width: '140px' }}>End Time</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '200px', width: '200px' }}>Purpose</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '140px', width: '140px' }}>Supporting Document</th>
                                {isAdmin && <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '80px', width: '80px' }}>Priority</th>}
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '100px', width: '100px' }}>Status</th>
                                <th style={{ padding: '12px 8px', textAlign: 'left', minWidth: '200px', width: '200px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map(booking => (
                                <tr key={booking.id} style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    transition: 'background-color 0.2s ease'
                                }} onMouseEnter={(e) => {
                                    e.target.parentElement.style.backgroundColor = 'var(--bg-hover, #f8f9fa)';
                                }} onMouseLeave={(e) => {
                                    e.target.parentElement.style.backgroundColor = 'transparent';
                                }}>
                                   
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', wordBreak: 'break-word' }}>{booking.booking_reference || 'N/A'}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>
                                        <Link to={`/resources/${booking.resource?.id}`} className="resource-link" style={{
                                            color: 'var(--primary-color)',
                                            textDecoration: 'none',
                                            fontWeight: '500'
                                        }}>
                                            {booking.resource?.name || 'N/A'}
                                        </Link>
                                    </td>
                                    {isAdmin && (
                                        <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>
                                            {booking.user ? (
                                                <>
                                                    {booking.user.first_name} {booking.user.last_name}
                                                    <br />
                                                    <small style={{ color: 'var(--text-secondary)' }}>{booking.user.email}</small>
                                                </>
                                            ) : 'N/A'}
                                        </td>
                                    )}
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>{moment(booking.start_time).format('YYYY-MM-DD HH:mm')}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>{moment(booking.end_time).format('YYYY-MM-DD HH:mm')}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px', wordBreak: 'break-word', maxWidth: '200px' }} className="purpose">{booking.purpose}</td>
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>
                                        {booking.supporting_document ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ 
                                                    fontSize: '12px', 
                                                    color: 'var(--text-secondary)',
                                                    fontWeight: '500'
                                                }}>
                                                    📄 Document Available
                                                </span>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    <button 
                                                        onClick={(e) => handleDocumentView(booking.id, e)}
                                                        className="document-link"
                                                        style={{
                                                            color: 'var(--primary-color)',
                                                            textDecoration: 'none',
                                                            fontWeight: '500',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            padding: '3px 6px',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'var(--primary-color-light, rgba(0, 123, 255, 0.1))',
                                                            transition: 'all 0.2s ease',
                                                            fontSize: '11px',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontFamily: 'inherit'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.backgroundColor = 'var(--primary-color, #007bff)';
                                                            e.target.style.color = 'var(--text-light-on-dark, white)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = 'var(--primary-color-light, rgba(0, 123, 255, 0.1))';
                                                            e.target.style.color = 'var(--primary-color)';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        👁️ View
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handleDocumentDownload(booking.id, e)}
                                                        className="document-link"
                                                        style={{
                                                            color: 'var(--accent-green, #28a745)',
                                                            textDecoration: 'none',
                                                            fontWeight: '500',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '3px',
                                                            padding: '3px 6px',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'var(--accent-green-light, rgba(40, 167, 69, 0.1))',
                                                            transition: 'all 0.2s ease',
                                                            fontSize: '11px',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontFamily: 'inherit'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.backgroundColor = 'var(--accent-green, #28a745)';
                                                            e.target.style.color = 'var(--text-light-on-dark, white)';
                                                            e.target.style.transform = 'translateY(-1px)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.backgroundColor = 'var(--accent-green-light, rgba(40, 167, 69, 0.1))';
                                                            e.target.style.color = 'var(--accent-green, #28a745)';
                                                            e.target.style.transform = 'translateY(0)';
                                                        }}
                                                    >
                                                        📥 Download
                                                    </button>
                                                </div>
                                                <small style={{ 
                                                    fontSize: '10px', 
                                                    color: 'var(--text-secondary)',
                                                    fontStyle: 'italic'
                                                }}>
                                                    {booking.supporting_document.split('/').pop() || 'Document'}
                                                </small>
                                            </div>
                                        ) : (
                                            <span style={{ 
                                                color: 'var(--text-secondary)', 
                                                fontStyle: 'italic',
                                                fontSize: '13px'
                                            }}>
                                                No document
                                            </span>
                                        )}
                                    </td>
                                    {isAdmin && <td>{booking.priority || 'N/A'}</td>}
                                    <td style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>
                                        <span className={
                                            booking.status === 'approved' ? 'status-approved' :
                                                booking.status === 'pending' ? 'status-pending' :
                                                    booking.status === 'in_use' ? 'status-in-use' :
                                                        booking.status === 'expired' ? 'status-expired' :
                                                            booking.status === 'cancelled' ? 'status-cancelled' : 
                                                                booking.status === 'rejected' ? 'status-rejected' :
                                                                    booking.status === 'completed' ? 'status-completed':
                                                                    'status-default' // Fallback class
                                        } style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            textTransform: 'capitalize'
                                        }}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="booking-actions-cell" style={{ padding: '12px 8px', textAlign: 'left', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            <Link to={`/booking/${booking.id}`} className="action-button view-button" style={{
                                                padding: '4px 8px',
                                                fontSize: '11px',
                                                textDecoration: 'none',
                                                borderRadius: '4px',
                                                backgroundColor: 'var(--primary-color)',
                                                color: 'var(--text-light-on-dark)',
                                                fontWeight: '500',
                                                transition: 'all 0.2s ease'
                                            }}>View</Link>
                                            {(isAdmin || (booking.user_id === user.id && ['pending', 'approved'].includes(booking.status))) && (
                                                <Link to={`/bookings/${booking.id}/edit`} className="action-button edit-button" style={{
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    textDecoration: 'none',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--accent-blue, #17a2b8)',
                                                    color: 'var(--text-light-on-dark)',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s ease'
                                                }}>Edit</Link>
                                            )}
                                            {booking.status === 'approved' && isAdmin && (
                                                <button onClick={() => handleStatusUpdate(booking.id, 'in_use')} className="action-button in-use-button" style={{
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--accent-green, #28a745)',
                                                    color: 'var(--text-light-on-dark)',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}>In Use</button>
                                            )}

                                            {booking.status === 'pending' && isAdmin && (
                                                <>
                                                    <button onClick={() => handleStatusUpdate(booking.id, 'approve')} className="action-button approve-button" style={{
                                                        padding: '4px 8px',
                                                        fontSize: '11px',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--accent-green, #28a745)',
                                                        color: 'var(--text-light-on-dark)',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}>Approve</button>
                                                    <button onClick={() => handleStatusUpdate(booking.id, 'reject')} className="action-button reject-button" style={{
                                                        padding: '4px 8px',
                                                        fontSize: '11px',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        backgroundColor: 'var(--accent-red, #dc3545)',
                                                        color: 'var(--text-light-on-dark)',
                                                        fontWeight: '500',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}>Reject</button>
                                                </>
                                            )}
                                            {/* Allow user to cancel their own pending/approved bookings */}
                                            {(booking.user_id === user.id && ['pending', 'approved'].includes(booking.status)) && (
                                                <>
                                                <button onClick={() => handleStatusUpdate(booking.id, 'cancel')} className="action-button cancel-button" style={{
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--accent-orange, #fd7e14)',
                                                    color: 'var(--text-light-on-dark)',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}>Cancel</button>
                                                
                                                </>
                                                
                                            )}
                                            {/* Admin can delete any booking, especially useful for rejected/cancelled/expired ones */}
                                            {isAdmin && (
                                                <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button" style={{
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'var(--accent-red, #dc3545)',
                                                    color: 'var(--text-light-on-dark)',
                                                    fontWeight: '500',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}>Delete</button>
                                            )}
                                        </div>
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