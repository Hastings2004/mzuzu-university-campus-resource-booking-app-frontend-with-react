import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function View() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const [resource, setResource] = useState(null);
    const [resourceBookings, setResourceBookings] = useState({
        pending: [],
        approved: [],
        in_use: []
    });
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [purpose, setPurpose] = useState("");
    const [bookingType, setBookingType] = useState("");
    const [priority, setPriority] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [isResourceAvailable, setIsResourceAvailable] = useState(null); 
    
    const availabilityStyle = {
        checking: { color: 'blue' , fontWeight: 'bold', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '5px' },
        available: { color: 'green', fontWeight: 'bold', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px' },
        notAvailable: { color: 'red', fontWeight: 'bold', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px' }
    };

    const statusStyles = {
        pending: { color: '#856404', backgroundColor: '#fff3cd', padding: '5px 10px', borderRadius: '3px', fontSize: '12px' },
        approved: { color: '#155724', backgroundColor: '#d4edda', padding: '5px 10px', borderRadius: '3px', fontSize: '12px' },
        in_use: { color: '#721c24', backgroundColor: '#f8d7da', padding: '5px 10px', borderRadius: '3px', fontSize: '12px' }
    };

    async function getResource() {
        const res = await fetch(`/api/resources/${id}`, {
            method: 'get',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();

        if (res.ok) {
            if (data.resource) {
                setResource(data.resource);
            } else if (data.data) { 
                setResource(data.data);
            } else { 
                setResource(data);
            }
            setBookingMessage(""); 
        } else {
            console.error("Failed to fetch resource:", data);
            setResource(null);
            setBookingMessage(`Failed to load resource details: ${data.message || 'Resource not found or unauthorized.'}`);
        }
    }

    async function getResourceBookings() {
        try {
            const res = await fetch(`/api/resources/${id}/bookings`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (res.ok) {
                // Organize bookings by status
                const bookingsByStatus = {
                    pending: [],
                    approved: [],
                    in_use: []
                };

                if (data.bookings && Array.isArray(data.bookings)) {
                    data.bookings.forEach(booking => {
                        const currentTime = new Date();
                        const startTime = new Date(booking.start_time);
                        const endTime = new Date(booking.end_time);

                        // Determine status based on booking state and time
                        if (booking.status === 'pending') {
                            bookingsByStatus.pending.push(booking);
                        } else if (booking.status === 'approved') {
                            // Check if currently in use
                            if (currentTime >= startTime && currentTime <= endTime) {
                                bookingsByStatus.in_use.push(booking);
                            } else {
                                bookingsByStatus.approved.push(booking);
                            }
                        }
                    });
                }

                setResourceBookings(bookingsByStatus);
            } else {
                console.error("Failed to fetch resource bookings:", data);
            }
        } catch (error) {
            console.error("Error fetching resource bookings:", error);
        }
    }

    async function handleAvailabilityCheck() {
        setBookingMessage("");
        setIsResourceAvailable(null);

        if (!resource) {
            console.warn("Resource data not loaded yet for availability check.");
            setBookingMessage("Resource data not loaded. Cannot check availability.");
            return;
        }

        if (!startTime || !endTime) {
            setIsResourceAvailable(null); 
            return;
        }

        const startDateTime = new Date(startTime);
        const endDateTime = new Date(endTime);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            setBookingMessage("Invalid date or time format.");
            setIsResourceAvailable(false);
            return;
        }

        if (startDateTime >= endDateTime) {
            setBookingMessage("End time must be after start time for availability check.");
            setIsResourceAvailable(false);
            return;
        }

        const startDateISO = startDateTime.toISOString();
        const endDateISO = endDateTime.toISOString();

        try {
            const res = await fetch('/api/bookings/check-availability', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ resource_id: resource.id, start_time: startDateISO, end_time: endDateISO })
            });

            const data = await res.json();

            if (res.ok) {
                setBookingMessage(`Resource is available for the selected time.`);
                setIsResourceAvailable(true);
            } else {
                console.error("Availability check failed:", data);
                setBookingMessage(`Availability check failed: ${data.message || 'Unknown error'}`);
                setIsResourceAvailable(false);
            }
        } catch (error) {
            console.error("Network or fetch error during availability check:", error);
            setBookingMessage(`An error occurred while checking availability: ${error.message}`);
            setIsResourceAvailable(false);
        }
    }

    useEffect(() => {
        if (startTime && endTime) {
            handleAvailabilityCheck();
        } else {
            setIsResourceAvailable(null);
            setBookingMessage(""); 
        }
    }, [startTime, endTime]); 

    async function handleSubmitBooking(e) {
        e.preventDefault();
        setBookingMessage("");
        setValidationErrors({});

        console.log('🔍 Booking submission started');

        if (!user) {
            setBookingMessage("You must be logged in to book a resource.");
            return;
        }

        if (!token) {
            setBookingMessage("Authentication required. Please log in again.");
            return;
        }

        if (!resource) {
            setBookingMessage("Resource data not loaded yet. Please refresh and try again.");
            return;
        }

        if (!startTime || !endTime || !purpose || !bookingType) {
            setBookingMessage("Please fill in all booking details (Start Time, End Time, Purpose, Booking Type).");
            return;
        }

        const trimmedPurpose = purpose.trim();
        if (trimmedPurpose.length < 10) {
            setBookingMessage("Purpose must be at least 10 characters long.");
            return;
        }

        if (trimmedPurpose.length > 500) {
            setBookingMessage("Purpose cannot exceed 500 characters.");
            return;
        }

        let startDate, endDate;
        try {
            startDate = new Date(startTime);
            endDate = new Date(endTime);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                setBookingMessage("Invalid date format. Please check your date inputs.");
                return;
            }

            if (startDate >= endDate) {
                setBookingMessage("End time must be after start time.");
                return;
            }

            const now = new Date();
            now.setSeconds(now.getSeconds() - 60);
            if (startDate <= now) {
                setBookingMessage("Start time must be in the future.");
                return;
            }

            const threeMonthsFromNow = new Date();
            threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
            if (startDate > threeMonthsFromNow) {
                setBookingMessage("Bookings cannot be made more than 3 months in advance.");
                return;
            }

        } catch (error) {
            console.error('Date parsing error:', error);
            setBookingMessage("Invalid date format. Please check your date inputs.");
            return;
        }

        if (isResourceAvailable !== true) {
            await handleAvailabilityCheck(); 
            if (isResourceAvailable !== true) { 
                setBookingMessage("Resource is not available for the selected time. Please adjust your times.");
                return;
            }
        }

        const bookingData = {
            resource_id: resource.id,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            purpose: trimmedPurpose,
            booking_type: bookingType,
        };

        if (user?.user_type === 'admin' && priority && priority.trim() !== '') {
            const priorityNum = parseInt(priority, 10);
            if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 4) {
                bookingData.priority = priorityNum;
            } else {
                setBookingMessage("Priority must be a number between 1 and 4.");
                return;
            }
        }

        console.log('Sending booking data:', bookingData);
        console.log('Exact JSON being sent:', JSON.stringify(bookingData, null, 2));

        setBookingMessage("Submitting booking request...");

        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(bookingData)
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const res = await fetch("/api/bookings", {
                ...requestOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('Response status:', res.status);
            console.log('Response headers:', Object.fromEntries(res.headers.entries()));

            let data;
            const contentType = res.headers.get('content-type');

            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                const textResponse = await res.text();
                console.error('Non-JSON response received:', textResponse);

                if (res.status === 302 || textResponse.includes('login') || textResponse.includes('redirect')) {
                    setBookingMessage("Your session has expired or you need to log in. Redirecting to login...");
                    navigate('/login');
                    return;
                }

                setBookingMessage("Server returned an unexpected response format. Please try again.");
                return;
            }

            console.log('Response data:', data);

            if (res.ok) {
                let successMsg = data.message || "Booking request submitted successfully!";

                if (data.preempted_bookings && data.preempted_bookings.length > 0) {
                    successMsg += ` ${data.preempted_bookings.length} existing booking(s) were preempted by this higher priority booking.`;
                }

                console.log('Booking successful:', successMsg);
                setBookingMessage(successMsg);

                setStartTime("");
                setEndTime("");
                setPurpose("");
                setPriority("");
                setBookingType("");
                setIsResourceAvailable(null);

                // Refresh bookings after successful submission
                getResourceBookings();

            } else {
                console.error('Booking failed with status:', res.status);
                console.error('Error data:', data);

                switch (res.status) {
                    case 401:
                        setBookingMessage("Your session has expired. Please log in again.");
                        navigate('/login');
                        break;

                    case 403:
                        setBookingMessage(data.message || "You don't have permission to perform this action.");
                        break;

                    case 422:
                        if (data.errors) {
                            console.log('Validation errors:', data.errors);
                            setValidationErrors(data.errors);
                            const errorMessages = Object.values(data.errors).flat();
                            setBookingMessage(`Please correct the following errors: ${errorMessages.join(', ')}`);
                        } else {
                            setBookingMessage(data.message || "Please correct the errors in your booking details.");
                        }
                        break;

                    case 409:
                        if (data.conflicting_bookings && data.conflicting_bookings.length > 0) {
                            const conflictDetails = data.conflicting_bookings
                                .map(conflict => `${conflict.user_name || 'Unknown User'} (${new Date(conflict.start_time).toLocaleString()} - ${new Date(conflict.end_time).toLocaleString()})`)
                                .join(', ');
                            setBookingMessage(`${data.message || 'Resource conflict detected.'} Conflicting bookings: ${conflictDetails}.`);
                        } else {
                            setBookingMessage(data.message || 'Resource conflict detected (another booking exists in this slot).');
                        }
                        setIsResourceAvailable(false);
                        break;

                    case 429:
                        setBookingMessage(data.message || 'Too many requests. Please try again later, or you have too many active bookings.');
                        break;

                    case 500:
                        let errorMsg = 'A server error occurred. Please try again later.';
                        if (data.debug_error && process.env.NODE_ENV === 'development') {
                            errorMsg += ` Debug: ${data.debug_error}`;
                        }
                        console.error('Server error details:', data);
                        setBookingMessage(errorMsg);
                        break;

                    default:
                        setBookingMessage(data.message || `Request failed with status ${res.status}. Please try again.`);
                }
            }

        } catch (error) {
            console.error("🌐 Network or fetch error:", error);
            console.error("🌐 Error details:", {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            if (error.name === 'AbortError') {
                setBookingMessage("Request timed out. Please check your internet connection and try again.");
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setBookingMessage("Network error. Please check your internet connection and try again.");
            } else if (error.name === 'SyntaxError') {
                setBookingMessage("Server returned invalid data. Please try again.");
            } else {
                setBookingMessage(`An unexpected error occurred: ${error.message}. Please try again.`);
            }
        }
    }

    async function handleDelete(e) {
        e.preventDefault();

        if (!resource) {
            console.warn("Resource data not loaded yet for deletion attempt.");
            setBookingMessage("Resource data not loaded. Cannot delete.");
            return;
        }

        if (!user) {
            setBookingMessage("You must be logged in to delete a resource.");
            return;
        }

        if (!token) {
            setBookingMessage("Authentication required. Please log in again to delete.");
            return;
        }

        if (user && (user.id === resource.user_id || user.user_type === 'admin')) {
            const confirmDelete = window.confirm(`Are you sure you want to delete "${resource.name}"? This action cannot be undone.`);
            if (!confirmDelete) {
                return;
            }

            setBookingMessage("Deleting resource...");
            try {
                const res = await fetch(`/api/resources/${id}`, {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const contentType = res.headers.get('content-type');
                let data;
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json();
                } else {
                    data = { message: await res.text() };
                }

                if (res.ok) {
                    setBookingMessage(data.message || "Resource deleted successfully!");
                    setTimeout(() => {
                        navigate("/");
                    }, 1500);
                } else {
                    console.error("Failed to delete resource:", data);
                    setBookingMessage(`Failed to delete resource: ${data.message || 'Unknown error'}`);
                }
            } catch (error) {
                console.error("Network or fetch error during deletion:", error);
                setBookingMessage(`An error occurred during deletion: ${error.message}`);
            }
        } else {
            console.warn("User not authorized to delete this resource.");
            setBookingMessage("You are not authorized to delete this resource.");
        }
    }

    useEffect(() => {
        if (id && token) {
            getResource();
            getResourceBookings();
        }
    }, [id, token, navigate]);

    const displayError = (field) => {
        if (validationErrors[field]) {
            return <p className="error-message">{validationErrors[field][0]}</p>;
        }
        return null;
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const renderBookingList = (bookings, title, status) => {
        if (bookings.length === 0) return null;
        
        return (
            <div className="booking-status-section">
                <h4>{title} ({bookings.length})</h4>
                <div className="booking-list">
                    {bookings.map((booking, index) => (
                        <div key={booking.id || index} className="booking-item">
                            <div className="booking-info">
                                <p><strong>User:</strong> {booking.user_name || 'Unknown'}</p>
                                <p><strong>Time:</strong> {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}</p>
                                <p><strong>Purpose:</strong> {booking.purpose}</p>
                                <p><strong>Type:</strong> {booking.booking_type}</p>
                                {booking.priority && <p><strong>Priority:</strong> {booking.priority}</p>}
                            </div>
                            <span style={statusStyles[status]} className="booking-status">
                                {status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="single-resource-container">
                <div className="resource-content">
                    <div className="resource-main">
                        {resource ? (
                            <div key={resource.id} className="single-resource-card">
                                <h2 className="single-resource-title">{resource.name}</h2>
                                <p className="single-resource-detail"><strong>Description:</strong> {resource.description}</p>
                                <p className="single-resource-detail"><strong>Location:</strong> {resource.location}</p>
                                <p className="single-resource-detail"><strong>Capacity:</strong> {resource.capacity}</p>
                                <span className="">
                                    Availability status: <span className={resource.is_active ? 'status-available' : 'status-booked'}>
                                        {resource.is_active ? 'Available' : 'Unavailable'}
                                    </span>
                                </span>

                                {(user && (user.id === resource.user_id || user.user_type === 'admin')) && (
                                    <div className="action-buttons">
                                        <Link to={`/resources/edit/${resource.id}`} className="action-button edit-button">Edit Resource</Link>
                                        <button onClick={handleDelete} className="action-button delete-button">Delete Resource</button>
                                    </div>
                                )}

                                {user ? (
                                    <div className="booking-form-section">
                                        <h3>Book this Resource</h3>
                                        <form onSubmit={handleSubmitBooking} className="booking-form">
                                            <div className="form-group">
                                                <label htmlFor="startTime">Start Time:</label>
                                                <input
                                                    type="datetime-local"
                                                    id="startTime"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    required
                                                    className="form-input"
                                                />
                                                {displayError('start_time')}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="endTime">End Time:</label>
                                                <input
                                                    type="datetime-local"
                                                    id="endTime"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    required
                                                    className="form-input"
                                                />
                                                {displayError('end_time')}
                                            </div>

                                            {isResourceAvailable === true && (
                                                <p style={availabilityStyle.available}>Resource is available for these times.</p>
                                            )}
                                            {isResourceAvailable === false && (
                                                <p style={availabilityStyle.notAvailable}>Resource is NOT available for these times. Please adjust your selection.</p>
                                            )}
                                            {isResourceAvailable === null && startTime && endTime && (
                                                <p style={availabilityStyle.checking}>Checking availability...</p>
                                            )}

                                            <div className='form-group'>
                                                <label htmlFor="bookingType">Booking Type:</label>
                                                <select
                                                    name="booking_type"
                                                    id="bookingType"
                                                    className={`form-input ${validationErrors.booking_type ? 'input-error' : ''}`}
                                                    value={bookingType}
                                                    onChange={(e) => setBookingType(e.target.value)}
                                                    required
                                                >
                                                    <option value="">-------------------Booking type---------------------</option>
                                                    <option value="university_activity">University Activity</option>
                                                    <option value="staff_meeting">Staff Meeting</option>
                                                    <option value="class">Student Class</option>
                                                    <option value="student_meeting">Student Activity</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                {displayError('booking_type')}
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="purpose">Purpose of Booking:</label>
                                                <textarea
                                                    id="purpose"
                                                    value={purpose}
                                                    onChange={(e) => setPurpose(e.target.value)}
                                                    rows="4"
                                                    required
                                                    className="form-textarea"
                                                ></textarea>
                                                {displayError('purpose')}
                                            </div>

                                            {user.user_type === 'admin' && (
                                                <div className="form-group">
                                                    <label htmlFor="priority">Priority (1=Critical, 4=Low):</label>
                                                    <input
                                                        type="number"
                                                        id="priority"
                                                        value={priority}
                                                        onChange={(e) => setPriority(e.target.value)}
                                                        min="1"
                                                        max="4"
                                                        className="form-input"
                                                        placeholder="e.g., 1 for Critical"
                                                    />
                                                    {displayError('priority')}
                                                </div>
                                            )}

                                            <button type="submit" className="action-button book-button" disabled={isResourceAvailable === false}>
                                                Submit Booking
                                            </button>
                                        </form>
                                        {bookingMessage && <p className="booking-message">{bookingMessage}</p>}
                                    </div>
                                ) : (
                                    <p className="login-prompt-message">Please <Link to="/login">log in</Link> to book this resource.</p>
                                )}
                            </div>
                        ) : (
                            <p className="resource-not-found-message">Loading resource or resource not found!</p>
                        )}
                    </div>
                </div>
                <div className="booking-status-sidebar">
                    <h3>Booking Status</h3>
                    <div className="booking-status-container">
                            {renderBookingList(resourceBookings.pending, "Pending Bookings", "pending")}
                            {renderBookingList(resourceBookings.approved, "Approved Bookings", "approved")}
                            {renderBookingList(resourceBookings.in_use, "Currently In Use", "in_use")}
                            
                            {resourceBookings.pending.length === 0 && 
                             resourceBookings.approved.length === 0 && 
                             resourceBookings.in_use.length === 0 && (
                                <p className="no-bookings">No active bookings for this resource.</p>
                            )}
                    </div>
                </div>
            </div>

            
        </>
    );
}