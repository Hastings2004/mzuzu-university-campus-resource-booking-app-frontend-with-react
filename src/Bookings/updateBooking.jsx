import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/appContext";
import { useNavigate, useParams } from "react-router-dom";
import moment from 'moment'; // <-- IMPORTANT: Make sure this import is present and moment.js is installed

export default function UpdateBooking() {
    const { id } = useParams(); // This 'id' should be the booking ID
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        resource_id: '', // Store resource_id if you need to display resource details
        start_time: '',
        end_time: '',
        purpose: '',
    });

    const expiredStyle = {
        color: 'red',
        fontWeight: 'bold',
        backgroundColor: '#f8d7da',
        
        padding: '10px',
    };
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [bookingDetails, setBookingDetails] = useState(null); // To store full booking details

    async function getBookingDetails() {
        setLoading(true);
        console.log("Fetching booking details for ID:", id); // Debugging: log the ID
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            const data = await res.json();
            console.log("API Response for booking details:", data); // Debugging: log the API response

            if (res.ok) {
                // Determine the actual booking object from the API response
                let actualBookingData = null;
                if (data.booking) { // If your API returns { booking: { ... } }
                    actualBookingData = data.booking;
                } else if (data.data) { // If your API returns { data: { ... } } (common for Laravel resources)
                    actualBookingData = data.data;
                } else { // If your API returns the booking object directly { id: ..., start_time: ... }
                    actualBookingData = data;
                }

                if (!actualBookingData) {
                    throw new Error("Booking data not found in API response.");
                }

                // Ensure the user is authorized to update this booking
                if (user.user_type !== 'admin' && actualBookingData.user_id !== user.id) {
                    alert("You are not authorized to view or update this booking.");
                    navigate("/my-bookings"); // Redirect to a safe page if not authorized
                    return;
                }

                // Format dates to "YYYY-MM-DDTHH:mm" for input type="datetime-local"
                setFormData({
                    resource_id: actualBookingData.resource_id,
                    start_time: moment(actualBookingData.start_time).format('YYYY-MM-DDTHH:mm'),
                    end_time: moment(actualBookingData.end_time).format('YYYY-MM-DDTHH:mm'),
                    purpose: actualBookingData.purpose,
                });
                setBookingDetails(actualBookingData); // Store full details
            } else {
                console.error("Failed to fetch booking details - API error:", data);
                alert(data.message || "Failed to fetch booking details. Please check if the booking exists and you have access.");
                navigate("/my-bookings"); // Redirect on API error (e.g., 404, 403)
            }
        } catch (error) {
            console.error("Error in getBookingDetails:", error);
            alert("An error occurred while fetching booking details: " + error.message);
            navigate("/my-bookings"); // Redirect on JavaScript errors (e.g., Moment.js not found, network issues)
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdate(e) {
        e.preventDefault();

        if (!window.confirm("Are you sure you want to update this booking?")) {
            return; // User cancelled
        }

        setErrors({}); // Clear previous errors

        try {
            const response = await fetch(`/api/bookings/${id}`, { // Target the booking endpoint
                method: "PUT", // Use PUT for updates
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    // Send formatted dates back to the backend
                    start_time: moment(formData.start_time).toISOString(),
                    end_time: moment(formData.end_time).toISOString(),
                    purpose: formData.purpose,
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || "Booking updated successfully!");
                navigate("/bookings"); // Or wherever you list user's bookings
            } else {
                if (response.status === 422 && data.errors) {
                    setErrors(data.errors);
                    console.log("Validation errors:", data.errors); // Debugging: log validation errors
                } else {
                    alert(data.message || "Failed to update booking. Please try again.");
                    console.error("Update API error:", data); // Debugging: log update API errors
                }
            }
        } catch (error) {
            console.error("Network or unexpected error during update:", error);
            alert("An unexpected error occurred. Please check your network and try again.");
        }
    }

    useEffect(() => {
        getBookingDetails();
    }, [id, token, user, navigate]); // Add dependencies for useEffect

    if (loading) {
        return <div className="container"><p>Loading booking details...</p></div>;
    }

    if (!bookingDetails) {
        // If bookingDetails is null, it means the fetch failed or booking not found
        return <div className="container"><p>Booking details could not be loaded. Please try again.</p></div>;
    }

    return (
        <>
            <div className="container">
                <div className="content">
                    <div>
                        {/* Use optional chaining for resource properties as they might be nested */}
                        <h3>Update Booking for {bookingDetails.resource?.name || 'Resource Not Found'}</h3>
                        <p>Current Status: <span className={
                                bookingDetails.status === 'approved'
                                    ? 'status-approved'
                                    : bookingDetails.status === 'pending'
                                        ? 'status-pending'
                                        : 'status-rejected'
                            }>{bookingDetails.status}</span></p>
                    </div>
                    <form onSubmit={handleUpdate}>
                        <div className="form-content">
                            <div className="form-detail">
                                <label htmlFor="start_time">Start Time</label>
                                <input
                                    type="datetime-local" // HTML5 input for date and time
                                    id="start_time"
                                    className="input"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                />
                                {errors.start_time && <p className="error">{errors.start_time[0]}</p>}
                            </div>

                            <div className="form-detail">
                                <label htmlFor="end_time">End Time</label>
                                <input
                                    type="datetime-local" // HTML5 input for date and time
                                    id="end_time"
                                    className="input"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                />
                                {errors.end_time && <p className="error">{errors.end_time[0]}</p>}
                            </div>

                            <div className="form-detail">
                                <label htmlFor="purpose">Purpose</label>
                                <textarea
                                    id="purpose"
                                    placeholder="Purpose of booking"
                                    className="input"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    rows="4"
                                ></textarea>
                                {errors.purpose && <p className="error">{errors.purpose[0]}</p>}
                            </div>
                            {bookingDetails.status === 'expired' || bookingDetails.status === 'rejected' ? (
                                <div className="form-detail">
                                    <p style={expiredStyle}>This booking cannot be updated because it is either expired or rejected.</p>
                                </div>
                            ) : <div className="form-detail">
                                <button type="submit">Update Booking</button>
                            </div>}
                            
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}