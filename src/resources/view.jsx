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
        const notificationPayload = {
            title: title,
            message: message,
            recipient_id: user.id
        };

        const res = await fetch('/api/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(notificationPayload)
        });

        const data = await res.json();

        if (res.ok) {
            console.log(`Notification created and sent successfully!`);
        } else {
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
            fullEndTime = new Date(`${startDate}T${endTime}`);
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

    const requiresDocument = user?.user_type === 'student' &&
        (bookingType === 'student_meeting' || bookingType === 'church_meeting');

    async function handleSubmitBooking(e) {
    e.preventDefault();
    setBookingMessage("");
    setValidationErrors({});

    console.log('🔍 Booking submission started');

    // Basic validation
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

    // Document requirement check
    if (requiresDocument && !supportingDocument) {
        setBookingMessage("For 'Student Meeting' or 'Church Meeting' booking types, students must upload a supporting document.");
        return;
    }

    let actualStartTime, actualEndTime;

    // Single day booking logic
    if (bookingOption === "single_day") {
        if (!startTime || !endTime) {
            setBookingMessage("Please enter start and end times for single-day booking.");
            return;
        }

        // --- MODIFIED LOGIC HERE ---
        let dateToUse;
        if (startDate) {
            dateToUse = startDate; // Use the selected date from the state
            console.log("Using selected startDate for single_day:", dateToUse);
        } else {
            // Fallback if startDate state is not set (e.g., initial load or not picked yet)
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            dateToUse = `${year}-${month}-${day}`;
            console.warn("startDate was empty for single_day, defaulting to current date:", dateToUse);
        }

        actualStartTime = new Date(`${dateToUse}T${startTime}`);
        actualEndTime = new Date(`${dateToUse}T${endTime}`); // **CRITICAL: Use dateToUse here too!**

        // Added more specific logging for debugging date parsing
        console.log(`Debug single_day construction: dateToUse=${dateToUse}, startTime=${startTime}, endTime=${endTime}`);
        console.log(`Debug single_day parsed: actualStartTime=${actualStartTime.toISOString()}, actualEndTime=${actualEndTime.toISOString()}`);

        // Validate same day
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

    // ENHANCED DEBUGGING: Detailed logging before submission
    console.log('=== DEBUGGING DATA BEFORE SUBMISSION ===');
    console.log('Resource object:', resource);
    console.log('Resource ID:', resource?.id, 'Type:', typeof resource?.id);
    console.log('Start time raw:', actualStartTime);
    console.log('End time raw:', actualEndTime);
    console.log('Start time ISO:', actualStartTime.toISOString());
    console.log('End time ISO:', actualEndTime.toISOString());
    console.log('Purpose:', purpose, 'Length:', purpose.length);
    console.log('Booking type:', bookingType);
    console.log('User:', user);
    console.log('=== END DEBUG INFO ===');

    // ENHANCED VALIDATION: Check resource_id
    if (!resource || !resource.id) {
        setBookingMessage("Resource ID is missing. Please refresh the page and try again.");
        return;
    }

    // Ensure resource.id is a number if backend expects it
    const resourceId = parseInt(resource.id, 10);
    if (isNaN(resourceId)) {
        setBookingMessage("Invalid resource ID format.");
        return;
    }

    // Enhanced date validation
    if (isNaN(actualStartTime.getTime()) || isNaN(actualEndTime.getTime())) {
        setBookingMessage("Invalid date or time format. Please check your inputs.");
        console.error('Invalid dates:', {
            startTime: actualStartTime,
            endTime: actualEndTime,
            startTimeValid: !isNaN(actualStartTime.getTime()),
            endTimeValid: !isNaN(actualEndTime.getTime())
        });
        return;
    }

    // Time validation
    if (actualStartTime >= actualEndTime) {
        setBookingMessage("End time must be after start time.");
        return;
    }

    // Future time validation
    const now = new Date();
    now.setSeconds(now.getSeconds() - 60); // Give a 60-second buffer
    if (actualStartTime <= now) {
        setBookingMessage("Start time must be in the future.");
        return;
    }

    // 3 months limit
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    if (actualStartTime > threeMonthsFromNow) {
        setBookingMessage("Bookings cannot be made more than 3 months in advance.");
        return;
    }

    // Re-check availability
    // It's crucial that `handleAvailabilityCheck` has updated `isResourceAvailable`
    // before this point, possibly in a `useEffect`. If not, this `await` is key.
    if (isResourceAvailable !== true) {
        await handleAvailabilityCheck(); // Ensure this is awaited if it's an async operation
        if (isResourceAvailable !== true) {
            setBookingMessage("Resource is not available for the selected time. Please adjust your times.");
            return;
        }
    }

    // Enhanced purpose validation
    if (!purpose || typeof purpose !== 'string') {
        setBookingMessage("Purpose is required and must be text.");
        return;
    }

    const trimmedPurpose = purpose.trim();
    if (trimmedPurpose.length < 10) {
        setBookingMessage(`Purpose must be at least 10 characters long. Current length: ${trimmedPurpose.length}`);
        return;
    }

    if (trimmedPurpose.length > 500) {
        setBookingMessage(`Purpose cannot exceed 500 characters. Current length: ${trimmedPurpose.length}`);
        return;
    }

    // CREATE FORMDATA WITH EXPLICIT TYPE CONVERSION
    const formData = new FormData();

    // Ensure resource_id is sent as string (most backends expect string in FormData)
    formData.append('resource_id', resourceId.toString());

    // Ensure dates are properly formatted
    const startTimeISO = actualStartTime.toISOString();
    const endTimeISO = actualEndTime.toISOString();

    formData.append('start_time', startTimeISO);
    formData.append('end_time', endTimeISO);
    formData.append('purpose', trimmedPurpose);
    formData.append('booking_type', bookingType);

    // Priority handling for admin
    if (user?.user_type === 'admin' && priority && priority.trim() !== '') {
        const priorityNum = parseInt(priority, 10);
        if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 4) {
            formData.append('priority', priorityNum.toString());
        } else {
            setBookingMessage("Priority must be a number between 1 and 4.");
            return;
        }
    }

    // Supporting document
    if (supportingDocument) {
        console.log('Adding supporting document:', supportingDocument.name, supportingDocument.type, supportingDocument.size);
        formData.append('supporting_document', supportingDocument);
    }

    // ENHANCED LOGGING OF FORMDATA
    console.log('=== FORMDATA CONTENTS ===');
    for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
            console.log(pair[0] + ': [FILE]', pair[1].name, pair[1].type, pair[1].size + ' bytes');
        } else {
            console.log(pair[0] + ': ' + pair[1] + ' (type: ' + typeof pair[1] + ')');
        }
    }
    console.log('=== END FORMDATA ===');

    setBookingMessage("Submitting booking request...");

    try {
        const requestOptions = {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                // DO NOT set Content-Type for FormData; browser sets it automatically
            },
            body: formData
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

        const res = await fetch("/api/bookings", {
            ...requestOptions,
            signal: controller.signal
        });

        clearTimeout(timeoutId); // Clear timeout if fetch completes in time

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
                navigate('/login'); // Assuming `Maps` is available from react-router-dom
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

            let message = `You have successfully booked the ${resource.name} from ${actualStartTime.toLocaleString()} to ${actualEndTime.toLocaleString()}`;

            // Assuming `sendNotification` is a function you have for displaying user notifications
            sendNotification(message);
            window.alert("Successfully booking");
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
            setSupportingDocument(null);
            setBookingOption("single_day");
            setIsResourceAvailable(null);

            // Assuming `getResourceBookings` is a function to refresh the list of bookings
            getResourceBookings();

        } else {
            console.error('Booking failed with status:', res.status);
            console.error('Error data:', data);

            // ENHANCED ERROR HANDLING FOR VALIDATION ERRORS
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
                        console.log('=== VALIDATION ERRORS DETAIL ===');
                        Object.entries(data.errors).forEach(([field, errors]) => {
                            console.log(`Field "${field}":`, errors);
                        });
                        console.log('=== END VALIDATION ERRORS ===');

                        setValidationErrors(data.errors);

                        // Create detailed error message from backend validation
                        const errorMessages = [];
                        Object.entries(data.errors).forEach(([field, errors]) => {
                            errorMessages.push(`${field}: ${errors.join(', ')}`);
                        });

                        setBookingMessage(`Validation failed:\n${errorMessages.join('\n')}`);
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
                    if (data.debug_error && process.env.NODE_ENV === 'development') { // Display debug info only in development
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

// ALTERNATIVE: JSON-ONLY VERSION (if no file uploads needed)
// This function is provided as an alternative if you don't need file uploads
// and your backend prefers JSON. It's not part of the primary fix for the
// 422 error you're experiencing with FormData.
async function handleSubmitBookingAsJSON(e) {
    e.preventDefault();
    setBookingMessage("");
    setValidationErrors({});

    if (!user || !token || !resource || !purpose || !bookingType) {
        setBookingMessage("Please ensure all required fields are filled and you are logged in, and resource data is loaded.");
        return;
    }

    const requiresDocument = user?.user_type === 'student' &&
                             (bookingType === 'student_meeting' || bookingType === 'church_meeting');

    if (requiresDocument && !supportingDocument) {
        setBookingMessage("For 'Student Meeting' or 'Church Meeting' booking types, students must upload a supporting document.");
        return;
    }

    let actualStartTime, actualEndTime;

    if (bookingOption === "single_day") {
        if (!startTime || !endTime) {
            setBookingMessage("Please enter start and end times for single-day booking.");
            return;
        }
        let dateToUse;
        if (startDate) {
            dateToUse = startDate;
        } else {
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            dateToUse = `${year}-${month}-${day}`;
        }
        actualStartTime = new Date(`${dateToUse}T${startTime}`);
        actualEndTime = new Date(`${dateToUse}T${endTime}`); // **CRITICAL: Use dateToUse here too!**

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

    if (isNaN(actualStartTime.getTime()) || isNaN(actualEndTime.getTime()) || actualStartTime >= actualEndTime) {
        setBookingMessage("Invalid date/time or end time is not after start time.");
        return;
    }

    const now = new Date();
    now.setSeconds(now.getSeconds() - 60); // 60-second buffer
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

    if (isResourceAvailable !== true) {
        await handleAvailabilityCheck();
        if (isResourceAvailable !== true) {
             setBookingMessage("Resource is not available for the selected time. Please adjust your times.");
             return;
        }
    }

    if (!purpose || typeof purpose !== 'string') {
        setBookingMessage("Purpose is required and must be text.");
        return;
    }
    const trimmedPurpose = purpose.trim();
    if (trimmedPurpose.length < 10 || trimmedPurpose.length > 500) {
        setBookingMessage("Purpose must be between 10 and 500 characters long.");
        return;
    }

    // Instead of FormData, use JSON
    const bookingData = {
        resource_id: parseInt(resource.id, 10), // or keep as string if backend expects string
        start_time: actualStartTime.toISOString(),
        end_time: actualEndTime.toISOString(),
        purpose: trimmedPurpose,
        booking_type: bookingType
    };

    if (user?.user_type === 'admin' && priority && priority.trim() !== '') {
        const priorityNum = parseInt(priority, 10);
        if (!isNaN(priorityNum) && priorityNum >= 1 && priorityNum <= 4) {
            bookingData.priority = priorityNum;
        }
    }

    // No file uploads possible with JSON directly, so `supportingDocument` is not appended here.
    // If files are needed, you must use FormData.

    console.log('Sending JSON data:', bookingData);

    setBookingMessage("Submitting booking request...");

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

        const res = await fetch("/api/bookings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(bookingData),
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

            let message = `You have successfully booked the resource from ${actualStartTime.toLocaleString()} to ${actualEndTime.toLocaleString()}`;

            sendNotification(message);
            console.log('Booking successful:', successMsg);
            setBookingMessage(successMsg);

            setStartDate("");
            setEndDate("");
            setStartTime("");
            setEndTime("");
            setPurpose("");
            setPriority("");
            setBookingType("");
            setSupportingDocument(null);
            setBookingOption("single_day");
            setIsResourceAvailable(null);

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
                        console.log('=== VALIDATION ERRORS DETAIL ===');
                        Object.entries(data.errors).forEach(([field, errors]) => {
                            console.log(`Field "${field}":`, errors);
                        });
                        console.log('=== END VALIDATION ERRORS ===');

                        setValidationErrors(data.errors);

                        const errorMessages = [];
                        Object.entries(data.errors).forEach(([field, errors]) => {
                            errorMessages.push(`${field}: ${errors.join(', ')}`);
                        });

                        setBookingMessage(`Validation failed:\n${errorMessages.join('\n')}`);
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
                                        <form onSubmit={requiresDocument ? handleSubmitBooking : handleSubmitBookingAsJSON} className="booking-form">
                                            <div className="form-group">
                                                <label>Select Booking Duration:</label>
                                                <div className="radio-group">
                                                    <label>
                                                        <input
                                                            type="radio"
                                                            value="single_day"
                                                            checked={bookingOption === "single_day"}
                                                            onChange={() => setBookingOption("single_day")}
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
                                                {/* For single-day, type can still be time, but for multi-day, it's combined with date */}
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

                                            {isResourceAvailable === true && (
                                                <p style={availabilityStyle.available}>Resource is available for these times.</p>
                                            )}
                                            {isResourceAvailable === false && (
                                                <p style={availabilityStyle.notAvailable}>Resource is NOT available for these times. Please adjust your selection.</p>
                                            )}
                                            {isResourceAvailable === null && (startTime || (bookingOption === "multi_day" && startDate)) && (endTime || (bookingOption === "multi_day" && endDate)) && (
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
                                                    <small className="form-text-muted">Required for Student Meeting</small>
                                                    {displayError('supporting_document')}
                                                </div>
                                            )}
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

                                            <button 
                                                type="submit" 
                                                className="action-button book-button" 
                                                disabled={isResourceAvailable === false}>
                                                Submit Booking
                                            </button>
                                        </form>
                                        {bookingMessage && <p className="booking-message">{bookingMessage}</p>}
                                    </div>
                                ) : (
                                    <p className="login-prompt-message">Please <Link to="/login">log in</Link> to book this resource.</p>
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
                            <p className="resource-not-found-message">Loading resource or resource not found!</p>
                        )}
                    </div>
                </div>
                <div className="booking-status-sidebar">     
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