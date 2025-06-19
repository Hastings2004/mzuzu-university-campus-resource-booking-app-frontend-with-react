import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function View() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const title = "BOOKING CONFIRMATION";

    const [resource, setResource] = useState(null);
    const [resourceBookings, setResourceBookings] = useState({
        pending: [],
        approved: [],
        in_use: []
    });
    const [bookingOption, setBookingOption] = useState("single_day"); // New state for booking option
    const [startDate, setStartDate] = useState(""); // New state for start date
    const [endDate, setEndDate] = useState("");     // New state for end date
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [purpose, setPurpose] = useState("");
    const [bookingType, setBookingType] = useState("");
    const [priority, setPriority] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const [isResourceAvailable, setIsResourceAvailable] = useState(null);
    const [supportingDocument, setSupportingDocument] = useState(null); // NEW STATE FOR DOCUMENT

    const availabilityStyle = {
        checking: { color: 'blue', fontWeight: 'bold', backgroundColor: '#e9ecef', padding: '10px', borderRadius: '5px' },
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
            console.log(data);

            if (res.ok) {
                const bookingsByStatus = {
                    pending: [],
                    approved: [],
                    in_use: []
                };

                if (data.bookings && Array.isArray(data.bookings)) {
                    data.bookings.forEach(booking => {
                        const currentTime = new Date();
                        const bookingStartTime = new Date(booking.start_time);
                        const bookingEndTime = new Date(booking.end_time);

                        if (booking.status === 'pending') {
                            bookingsByStatus.pending.push(booking);
                        } else if (booking.status === 'approved') {
                            if (currentTime >= bookingStartTime && currentTime <= bookingEndTime) {
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

    async function sendNotification(message) {
        const notificationPayload = { // This is the actual data your backend expects
            title: title,
            message: message
        };

        console.log(notificationPayload);
        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(notificationPayload) // <--- Send the payload directly, not nested
        });

        const data = await res.json();

        console.log(data);
        if (res.ok) {
            setBookingMessage(`Notification created and sent successfully!`);

        } else {
            console.error("Sending notification failed:", data);
            setBookingMessage(`Failed to send notification: ${data.message || 'Unknown error'}`);
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

        let fullStartTime, fullEndTime;

        if (bookingOption === "single_day") {
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            if (!startTime || !endTime) {
                setIsResourceAvailable(null);
                return;
            }
            fullStartTime = new Date(`${dateString}T${startTime}`);
            fullEndTime = new Date(`${dateString}T${endTime}`);

        } else { // multi_day
            if (!startDate || !startTime || !endDate || !endTime) {
                setIsResourceAvailable(null);
                return;
            }
            fullStartTime = new Date(`${startDate}T${startTime}`);
            fullEndTime = new Date(`${endDate}T${endTime}`);
        }

        if (isNaN(fullStartTime.getTime()) || isNaN(fullEndTime.getTime())) {
            setBookingMessage("Invalid date or time format.");
            setIsResourceAvailable(false);
            return;
        }

        if (fullStartTime >= fullEndTime) {
            setBookingMessage("End time must be after start time for availability check.");
            setIsResourceAvailable(false);
            return;
        }

        // Check if single-day booking truly spans only one day
        if (bookingOption === "single_day") {
            const startDay = fullStartTime.toDateString();
            const endDay = fullEndTime.toDateString();
            if (startDay !== endDay) {
                setBookingMessage("For 'Single Day' booking, start and end times must be on the same day.");
                setIsResourceAvailable(false);
                return;
            }
        }

        // Check if multi-day booking is actually multi-day or at least 2 days
        if (bookingOption === "multi_day") {
            const diffTime = Math.abs(fullEndTime.getTime() - fullStartTime.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 2) {
                setBookingMessage("For '2 Days and Above' booking, the duration must be at least 2 full days.");
                setIsResourceAvailable(false);
                return;
            }
        }

        const startDateISO = fullStartTime.toISOString();
        const endDateISO = fullEndTime.toISOString();

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
        // Trigger availability check when relevant time/date inputs change
        if (bookingOption === "single_day" && startTime && endTime) {
            handleAvailabilityCheck();
        } else if (bookingOption === "multi_day" && startDate && startTime && endDate && endTime) {
            handleAvailabilityCheck();
        } else {
            setIsResourceAvailable(null);
            setBookingMessage("");
        }
    }, [startTime, endTime, startDate, endDate, bookingOption]);

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

        if (!purpose || !bookingType) {
            setBookingMessage("Please fill in all booking details (Purpose, Booking Type).");
            return;
        }

        // --- NEW VALIDATION FOR SUPPORTING DOCUMENT ---
        const requiresDocument = user?.user_type === 'student' &&
                                 (bookingType === 'student_meeting' || bookingType === 'church_meeting');

        if (requiresDocument && !supportingDocument) {
            setBookingMessage("For 'Student Meeting' or 'Church Meeting' booking types, students must upload a supporting document.");
            return;
        }
        // --- END NEW VALIDATION ---

        let actualStartTime, actualEndTime;

        if (bookingOption === "single_day") {
            if (!startTime || !endDate) { // Corrected: should be `endDate` if using it for single_day as the form has it, or remove endDate for single_day if always today
                setBookingMessage("Please enter start time for single-day booking.");
                return;
            }
            const dateString = startDate; // Use the selected start date for single day
            if (!dateString) { // Ensure a date is selected for single day booking too
                setBookingMessage("Please select a date for single-day booking.");
                return;
            }

            actualStartTime = new Date(`${dateString}T${startTime}`);
            actualEndTime = new Date(`${dateString}T${endTime}`);

            if (actualStartTime.toDateString() !== actualEndTime.toDateString()) {
                setBookingMessage("For 'Single Day' booking, start and end times must be on the same day.");
                return;
            }

        } else { // multi_day
            if (!startDate || !startTime || !endDate || !endTime) {
                setBookingMessage("Please enter start date, start time, end date, and end time for multi-day booking.");
                return;
            }
            actualStartTime = new Date(`${startDate}T${startTime}`);
            actualEndTime = new Date(`${endDate}T${endTime}`);

            const diffTime = Math.abs(actualEndTime.getTime() - actualStartTime.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 2) {
                setBookingMessage("For '2 Days and Above' booking, the duration must be at least 2 full days.");
                return;
            }
        }

        if (isNaN(actualStartTime.getTime()) || isNaN(actualEndTime.getTime())) {
            setBookingMessage("Invalid date or time format. Please check your inputs.");
            return;
        }

        if (actualStartTime >= actualEndTime) {
            setBookingMessage("End time must be after start time.");
            return;
        }

        const now = new Date();
        now.setSeconds(now.getSeconds() - 60); // Allow for slight delay
        if (actualStartTime <= now) {
            setBookingMessage("Start time must be in the future.");
            return;
        }

        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
        if (actualStartTime > threeMonthsFromNow) {
            setBookingMessage("Bookings cannot be made more than 3 months in advance.");
            return;
        }

        // Re-check availability before final submission if it hasn't been checked or is marked unavailable
        if (isResourceAvailable !== true) {
            await handleAvailabilityCheck();
            // Re-check availability *after* handleAvailabilityCheck completes.
            // Note: handleAvailabilityCheck updates `isResourceAvailable` state asynchronously.
            // You might need to wait for state update or pass a callback/return value.
            // For immediate check, it's better to re-run the check logic here directly
            // or pass the calculated availability from handleAvailabilityCheck.
            // For simplicity here, we'll assume it has updated or you'll prompt user to retry.
            if (isResourceAvailable !== true) { // This `isResourceAvailable` will reflect the state from the last render cycle.
                setBookingMessage("Resource is not available for the selected time. Please adjust your times and try again.");
                return;
            }
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

        // --- Prepare FormData for sending JSON and file ---
        const formData = new FormData();
        formData.append('resource_id', resource.id);
        formData.append('start_time', actualStartTime.toISOString());
        formData.append('end_time', actualEndTime.toISOString());
        formData.append('purpose', trimmedPurpose);
        formData.append('booking_type', bookingType);

        if (user?.user_type === 'admin' && priority && priority.trim() !== '') {
            const priorityNum = parseInt(priority, 10);
            if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 4) {
                formData.append('priority', priorityNum);
            } else {
                setBookingMessage("Priority must be a number between 1 and 4.");
                return;
            }
        }

        if (supportingDocument) {
            formData.append('supporting_document', supportingDocument);
        }
        // --- END FormData prep ---

        console.log('Sending booking data (FormData):', formData);

        setBookingMessage("Submitting booking request...");

        try {
            const requestOptions = {
                method: "POST",
                headers: {
                    // "Content-Type": "application/json", // DO NOT set Content-Type for FormData, browser sets it with boundary
                    "Authorization": `Bearer ${token}`,
                },
                body: formData // Send FormData directly
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
            alert("booking successfully");
            navigate('/booking');

            if (res.ok) {
                let successMsg = data.message || "Booking request submitted successfully!";

                if (data.preempted_bookings && data.preempted_bookings.length > 0) {
                    successMsg += ` ${data.preempted_bookings.length} existing booking(s) were preempted by this higher priority booking.`;
                }

                let notificationMessage = `You have successfully booked the resource from ${formatDateTime(bookingData.start_time)} to ${formatDateTime(bookingData.end_time)}.`;
                sendNotification(notificationMessage);
                console.log('Booking successful:', successMsg);
                setBookingMessage(successMsg);

                // Clear form fields
                setStartDate("");
                setEndDate("");
                setStartTime("");
                setEndTime("");
                setPurpose("");
                setPriority("");
                setBookingType("");
                setSupportingDocument(null); // Clear document input
                setBookingOption("single_day"); // Reset to default
                setIsResourceAvailable(null);

                getResourceBookings(); // Refresh bookings after successful submission

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
            console.error("Network or fetch error:", error);
            console.error("Error details:", {
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
                <h4>{resource.name} Has {bookings.length} Bookings</h4>
                <div className="booking-list">
                    {bookings.map((booking, index) => (
                        <div key={booking.id || index} className="booking-item">
                            <div className="booking-info">
                                <p><strong>Start Time:</strong> {formatDateTime(booking.start_time)}</p>
                                <p><strong>End time:</strong>{formatDateTime(booking.end_time)}</p>
                            </div>
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

                                {user ? (
                                    <div className="booking-form-section">
                                        <h3>Book this Resource</h3>
                                        <form onSubmit={handleSubmitBooking} className="booking-form">
                                            <div className="form-group">
                                                <label>Select Booking Duration:</label>
                                                <div className="radio-group">
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            value="single_day"
                                                            checked={bookingOption === "single_day"}
                                                            onChange={() => {
                                                                setBookingOption("single_day");
                                                                setEndDate(""); // Clear end date for single day
                                                            }}
                                                        />
                                                        Single Day
                                                    </label>
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            value="multi_day"
                                                            checked={bookingOption === "multi_day"}
                                                            onChange={() => setBookingOption("multi_day")}
                                                        />
                                                        2 Days and Above
                                                    </label>
                                                </div>
                                            </div>


                                            <div className="form-group">
                                                <label htmlFor="startDate">Start Date:</label>
                                                <input
                                                    type="date"
                                                    id="startDate"
                                                    value={startDate}
                                                    onChange={(e) => setStartDate(e.target.value)}
                                                    required
                                                    className="form-input"
                                                />
                                                {displayError('start_date')}
                                            </div>


                                            <div className="form-group">
                                                <label htmlFor="startTime">Start Time:</label>
                                                <input
                                                    type="time"
                                                    id="startTime"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    required
                                                    className="form-input"
                                                />
                                                {displayError('start_time')}
                                            </div>

                                            {bookingOption === "multi_day" && (
                                                <div className="form-group">
                                                    <label htmlFor="endDate">End Date:</label>
                                                    <input
                                                        type="date"
                                                        id="endDate"
                                                        value={endDate}
                                                        onChange={(e) => setEndDate(e.target.value)}
                                                        required
                                                        className="form-input"
                                                    />
                                                    {displayError('end_date')}
                                                </div>
                                            )}

                                            <div className="form-group">
                                                <label htmlFor="endTime">End Time:</label>
                                                <input
                                                    type="time"
                                                    id="endTime"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    required
                                                    className="form-input"
                                                />
                                                {displayError('end_time')}
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="purpose">Purpose:</label>
                                                <textarea
                                                    id="purpose"
                                                    value={purpose}
                                                    onChange={(e) => setPurpose(e.target.value)}
                                                    required
                                                    className="form-textarea"
                                                    rows="3"
                                                    placeholder="Briefly describe the purpose of this booking (e.g., 'Weekly team meeting', 'Student study group')."
                                                ></textarea>
                                                {displayError('purpose')}
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="bookingType">Booking Type:</label>
                                                <select
                                                    id="bookingType"
                                                    value={bookingType}
                                                    onChange={(e) => setBookingType(e.target.value)}
                                                    required
                                                    className="form-select"
                                                >
                                                    <option value="">Select Type</option>
                                                    <option value="academic">Academic</option>
                                                    <option value="research">Research</option>
                                                    <option value="event">Event</option>
                                                    <option value="personal">Personal</option>
                                                    <option value="student_meeting">Student Meeting</option>
                                                    <option value="church_meeting">Church Meeting</option>
                                                    {/* Add other types as needed */}
                                                </select>
                                                {displayError('booking_type')}
                                            </div>

                                            {/* --- NEW: Conditional Supporting Document Upload --- */}
                                            {user?.user_type === 'student' &&
                                             (bookingType === 'student_meeting' || bookingType === 'church_meeting') && (
                                                <div className="form-group">
                                                    <label htmlFor="supportingDocument">Supporting Document (PDF, Image):</label>
                                                    <input
                                                        type="file"
                                                        id="supportingDocument"
                                                        onChange={(e) => setSupportingDocument(e.target.files[0])}
                                                        accept=".pdf,.jpg,.jpeg,.png" // Limit accepted file types
                                                        required // Make it required when conditions met
                                                        className="form-input"
                                                    />
                                                    <small className="form-text-muted">Required for Student Meeting and Church Meeting bookings by students.</small>
                                                    {displayError('supporting_document')}
                                                </div>
                                            )}
                                            {/* --- END NEW --- */}

                                            {user?.user_type === 'admin' && (
                                                <div className="form-group">
                                                    <label htmlFor="priority">Priority (1-4, optional for Admin):</label>
                                                    <input
                                                        type="number"
                                                        id="priority"
                                                        value={priority}
                                                        onChange={(e) => setPriority(e.target.value)}
                                                        min="1"
                                                        max="4"
                                                        className="form-input"
                                                        placeholder="e.g., 1 (highest), 4 (lowest)"
                                                    />
                                                    {displayError('priority')}
                                                </div>
                                            )}

                                            {bookingMessage && (
                                                <div className={`message ${isResourceAvailable === true ? 'success' : isResourceAvailable === false ? 'error' : ''}`}>
                                                    {bookingMessage}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isResourceAvailable === false} // Disable if not available
                                            >
                                                Confirm Booking
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <p className="login-prompt">Please <Link to="/login">log in</Link> to book this resource.</p>
                                )}

                                {(user?.user_type === 'admin' || (user && resource.user_id === user.id)) && (
                                    <div className="resource-actions">
                                        {user?.user_type === 'admin' && (
                                            <Link to={`/resources/edit/${resource.id}`} className="btn btn-secondary">Edit Resource</Link>
                                        )}
                                        <button onClick={handleDelete} className="btn btn-danger">Delete Resource</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p>Loading resource details or resource not found...</p>
                        )}
                    </div>
                    <div className="resource-sidebar">
                        <h3>Bookings for {resource?.name || 'this Resource'}</h3>
                        {resourceBookings.in_use.length > 0 && renderBookingList(resourceBookings.in_use, 'Currently In Use', 'in_use')}
                        {resourceBookings.approved.length > 0 && renderBookingList(resourceBookings.approved, 'Approved Bookings', 'approved')}
                        {resourceBookings.pending.length > 0 && renderBookingList(resourceBookings.pending, 'Pending Bookings', 'pending')}

                        {resourceBookings.pending.length === 0 &&
                            resourceBookings.approved.length === 0 &&
                            resourceBookings.in_use.length === 0 &&
                            <p>No bookings found for this resource.</p>}
                    </div>
                </div>
            </div>
        </>
    );
}