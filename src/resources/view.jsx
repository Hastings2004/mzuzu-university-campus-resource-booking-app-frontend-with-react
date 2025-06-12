import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function View() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const [resource, setResource] = useState(null);
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
    }

    async function getResource() {
        // console.log("Attempting to fetch resource with ID:", id, "and token:", token); // Added for debugging
        const res = await fetch(`/api/resources/${id}`, {
            method: 'get',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();

        if (res.ok) {
            // Adjust based on your resource API response structure
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

    async function handleAvailabilityCheck() {
        // Clear previous availability message
        setBookingMessage("");
        setIsResourceAvailable(null); // Reset availability status

        if (!resource) {
            console.warn("Resource data not loaded yet for availability check.");
            setBookingMessage("Resource data not loaded. Cannot check availability.");
            return;
        }

        if (!startTime || !endTime) {
            setIsResourceAvailable(null); 
            return;
        }

        // Validate that end time is after start time before checking availability
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

        // Convert to ISO strings for consistency
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

    // New useEffect to trigger availability check when startTime or endTime changes
    useEffect(() => {
        // Only trigger if both startTime and endTime are filled
        if (startTime && endTime) {
            handleAvailabilityCheck();
        } else {
            // Clear availability status if times are not fully entered
            setIsResourceAvailable(null);
            setBookingMessage(""); 
        }
    }, [startTime, endTime]); 


    //Booking Handler
    async function handleSubmitBooking(e) {
        e.preventDefault();
        setBookingMessage("");
        setValidationErrors({});

        console.log('🔍 Booking submission started');

        // Enhanced validation
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

        // Enhanced client-side validation
        if (!startTime || !endTime || !purpose || !bookingType) { // Added bookingType to required fields
            setBookingMessage("Please fill in all booking details (Start Time, End Time, Purpose, Booking Type).");
            return;
        }

        // Validate purpose length
        const trimmedPurpose = purpose.trim();
        if (trimmedPurpose.length < 10) {
            setBookingMessage("Purpose must be at least 10 characters long.");
            return;
        }

        if (trimmedPurpose.length > 500) {
            setBookingMessage("Purpose cannot exceed 500 characters.");
            return;
        }

        // Enhanced date validation with proper formatting
        let startDate, endDate;
        try {
            startDate = new Date(startTime);
            endDate = new Date(endTime);

            // Check for invalid dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                setBookingMessage("Invalid date format. Please check your date inputs.");
                return;
            }

            // Time validations
            if (startDate >= endDate) {
                setBookingMessage("End time must be after start time.");
                return;
            }

            // Check if start time is in the past
            const now = new Date();
            now.setSeconds(now.getSeconds() - 60); // Allow 60 seconds grace period
            if (startDate <= now) {
                setBookingMessage("Start time must be in the future.");
                return;
            }

            // Check if booking is too far in advance (optional - 3 months limit)
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

        // Ensure the availability state is true before proceeding with booking
        if (isResourceAvailable !== true) {
            await handleAvailabilityCheck(); 
            if (isResourceAvailable !== true) { 
                setBookingMessage("Resource is not available for the selected time. Please adjust your times.");
                return;
            }
        }

        // Prepare booking data with consistent ISO format
        const bookingData = {
            resource_id: resource.id,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            purpose: trimmedPurpose,
            booking_type: bookingType,
        };

        // Include priority if user is admin and priority is set
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

        // Show loading state
        setBookingMessage("Submitting booking request...");

        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Explicitly set content type
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(bookingData)
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
                    navigate('/login'); // Redirect to login
                    return;
                }

                setBookingMessage("Server returned an unexpected response format. Please try again.");
                return;
            }

            console.log('Response data:', data);

            if (res.ok) {
                // Handle successful booking
                let successMsg = data.message || "Booking request submitted successfully!";

                if (data.preempted_bookings && data.preempted_bookings.length > 0) {
                    successMsg += ` ${data.preempted_bookings.length} existing booking(s) were preempted by this higher priority booking.`;
                }

                console.log('Booking successful:', successMsg);
                setBookingMessage(successMsg);

                // Clear form fields on success
                setStartTime("");
                setEndTime("");
                setPurpose("");
                setPriority("");
                setBookingType("");
                setIsResourceAvailable(null); // Reset availability status after booking

            } else {
                // Handle different types of errors
                console.error('Booking failed with status:', res.status);
                console.error('Error data:', data);

                switch (res.status) {
                    case 401:
                        setBookingMessage("Your session has expired. Please log in again.");
                        navigate('/login'); // Redirect to login on 401
                        break;

                    case 403:
                        setBookingMessage(data.message || "You don't have permission to perform this action.");
                        break;

                    case 422:
                        // Validation errors
                        if (data.errors) {
                            console.log('Validation errors:', data.errors);
                            setValidationErrors(data.errors);

                            // Create a user-friendly error message
                            const errorMessages = Object.values(data.errors).flat();
                            setBookingMessage(`Please correct the following errors: ${errorMessages.join(', ')}`);
                        } else {
                            setBookingMessage(data.message || "Please correct the errors in your booking details.");
                        }
                        break;

                    case 409:
                        // Conflict errors
                        if (data.conflicting_bookings && data.conflicting_bookings.length > 0) {
                            const conflictDetails = data.conflicting_bookings
                                .map(conflict => `${conflict.user_name || 'Unknown User'} (${new Date(conflict.start_time).toLocaleString()} - ${new Date(conflict.end_time).toLocaleString()})`)
                                .join(', ');
                            setBookingMessage(`${data.message || 'Resource conflict detected.'} Conflicting bookings: ${conflictDetails}.`);
                        } else {
                            setBookingMessage(data.message || 'Resource conflict detected (another booking exists in this slot).');
                        }
                        setIsResourceAvailable(false); // Resource is not available due to conflict
                        break;

                    case 429:
                        // Rate limiting or too many active bookings
                        setBookingMessage(data.message || 'Too many requests. Please try again later, or you have too many active bookings.');
                        break;

                    case 500:
                        // Server error
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

            // Handle different error types
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
                return; // User cancelled
            }

            setBookingMessage("Deleting resource...");
            try {
                const res = await fetch(`/api/resources/${id}`, {
                    method: "DELETE", // Changed to DELETE for clarity
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const contentType = res.headers.get('content-type');
                let data;
                if (contentType && contentType.includes('application/json')) {
                    data = await res.json();
                } else {
                    data = { message: await res.text() }; // Get text if not JSON
                }

                if (res.ok) {
                    setBookingMessage(data.message || "Resource deleted successfully!");
                    setTimeout(() => {
                        navigate("/"); // Redirect on successful deletion after a short delay
                    }, 1500); // Give user time to read success message
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
        // Only attempt to fetch if id and token are available
        if (id && token) {
            getResource();
        } else if (!token) {
            // Optionally, if no token, indicate login is needed or redirect
            // setBookingMessage("Please log in to view resource details.");
            // navigate('/login'); // Uncomment if you want to force login immediately
        }
    }, [id, token, navigate]); // Re-run when id, token, or navigate changes

    // Helper to format validation error messages
    const displayError = (field) => {
        if (validationErrors[field]) {
            return <p className="error-message">{validationErrors[field][0]}</p>;
        }
        return null;
    };

    return (
        <>
            <div className="single-resource-container">
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

                        {user ? ( // Only show booking form if user is logged in
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

                                    {/* Display availability status here */}
                                    {isResourceAvailable === true && (
                                        <p style={availabilityStyle.available}>Resource is available for these times.</p>
                                    )}
                                    {isResourceAvailable === false && (
                                        <p style={availabilityStyle.notAvailable}>Resource is NOT available for these times. Please adjust your selection.</p>
                                    )}
                                    {isResourceAvailable === null && startTime && endTime && (
                                        <p style={availabilityStyle.checking}>Checking availability...</p>
                                    )}


                                    {/* Corrected Booking Type Select */}
                                    <div className='form-group'> {/* Changed to form-group for consistency */}
                                        <label htmlFor="bookingType">Booking Type:</label> {/* Added label for accessibility */}
                                        <select
                                            name="booking_type" // Changed to booking_type to match backend expectation
                                            id="bookingType" // Changed id to match label
                                            className={`form-input ${validationErrors.booking_type ? 'input-error' : ''}`} // Use validationErrors
                                            value={bookingType} // Use bookingType state
                                            onChange={(e) => setBookingType(e.target.value)} // Update bookingType state
                                            required
                                        >
                                            <option value="">-------------------Booking type---------------------</option>
                                            <option value="university_activity">University Activity</option>
                                            <option value="staff_meeting">Staff Meeting</option>
                                            <option value="class">Student Class</option>
                                            <option value="student_meeting">Student Activity</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {displayError('booking_type')} {/* Changed to booking_type */}
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

                                    {/* Admin-only Priority Input */}
                                    {user.user_type === 'admin' && (
                                        <div className="form-group">
                                            <label htmlFor="priority">Priority (1=Critical, 4=Low):</label>
                                            <input
                                                type="number"
                                                id="priority"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                                min="1"
                                                max="4" // Match your backend Enum values (assuming 4, not 5)
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
        </>
    );
}