import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/appContext";
import { Link } from "react-router-dom"; // Import Link if you want to navigate to resource/booking details

export default function MyBookings() {
    const { user, token } = useContext(AppContext);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function fetchMyBookings() {
        if (!user || !token) {
            setLoading(false);
            setError("You must be logged in to view bookings.");
            return;
        }

        try {
            setLoading(true);
            setError(null); // Clear previous errors

            const res = await fetch("/api/bookings", {
                method: 'get',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json' // Good practice to include
                }
            });

            const data = await res.json();

            if (res.ok) {
                setBookings(data);
            } else {
                setError(data.message || "Failed to fetch bookings.");
                console.error("Failed to fetch bookings:", data);
            }
        } catch (err) {
            setError("An error occurred while fetching bookings.");
            console.error("Network or API error:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Only fetch if user and token are available
        if (user && token) {
            fetchMyBookings();
        } else {
            // If user or token disappear (e.g., logout), clear bookings and set error
            setBookings([]);
            setLoading(false);
            setError("Please log in to view bookings.");
        }
    }, [user, token]); // Re-fetch if user or token changes

    if (loading) {
        return <p className="loading-message">Loading bookings...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    // Safely check user and user.user_type before rendering
    if (!user || !user.user_type) {
        return <p className="error-message">User data not available. Please log in.</p>;
    }

    return (
        <div className="my-bookings-container">
            <h1 className="my-bookings-title">
                {user.user_type === 'admin' ? "All System Bookings" : "My Bookings"}
            </h1>
            {bookings.length > 0 ? (
                <div className="bookings-list">
                    {bookings.map(booking => (
                        <div key={booking.id} className="booking-card">
                            <h2 className="booking-card-title">
                                {booking.resource ? (
                                    <Link to={`/resource/${booking.resource.id}`} className="resource-link">
                                        {booking.resource.name}
                                    </Link>
                                ) : (
                                    "Resource Name Not Available"
                                )}
                            </h2>
                            <p className="booking-detail"><strong>Purpose:</strong> {booking.purpose}</p>
                            <p className="booking-detail"><strong>Start Time:</strong> {new Date(booking.start_time).toLocaleString()}</p>
                            <p className="booking-detail"><strong>End Time:</strong> {new Date(booking.end_time).toLocaleString()}</p>

                            {/* Conditionally display "Booked by" only for admins */}
                            {user.user_type === 'admin' && booking.user && (
                                <p className="booking-detail"><strong>Booked by:</strong> {booking.user.first_name +" "+booking.user.last_name}</p>
                            )}

                            {/* Add a generic "View Details" link for consistency */}
                            <Link to={`/booking/${booking.id}`} className="view-details-button">View Details</Link>

                            {/* You can add more details or action buttons like "Cancel Booking" here */}
                            <div className="booking-actions">
                                {/* Example: Link to cancel/edit booking, if you have those routes */}
                                {/* <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button">Cancel Booking</button> */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-bookings-message">
                    {user.user_type === 'admin' ? "No bookings in the system yet." : "You have no bookings yet. Go book some resources!"}
                </p>
            )}
        </div>
    );
}