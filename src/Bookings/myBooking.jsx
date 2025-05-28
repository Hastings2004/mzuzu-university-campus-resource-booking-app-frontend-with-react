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
            setError("You must be logged in to view your bookings.");
            return;
        }

        try {
            setLoading(true);
            setError(null); // Clear previous errors

            const res = await fetch("/api/bookings", {
                method: 'get',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (res.ok) {
                setBookings(data); // Assuming the API returns an array of booking objects
            } else {
                setError(data.message || "Failed to fetch your bookings.");
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
        fetchMyBookings();
    }, [user, token]); // Re-fetch if user or token changes

    if (loading) {
        return <p className="loading-message">Loading your bookings...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="my-bookings-container">
            <h1 className="my-bookings-title">Current Bookings</h1>
            {bookings.length > 0 ? (
                <div className="bookings-list">
                    {bookings.map(booking => (
                        <div key={booking.id} className="booking-card">
                            <h2 className="booking-card-title">
                                {/* Link to the resource details page, if applicable */}
                                {booking.resource ? (
                                    <Link to={`/resources/${booking.resource.id}`} className="resource-link">
                                        {booking.resource.name}
                                    </Link>
                                ) : (
                                    "Resource Name Not Available"
                                )}
                            </h2>
                            <p className="booking-detail"><strong>Purpose:</strong> {booking.purpose}</p>
                            <p className="booking-detail"><strong>Start Time:</strong> {new Date(booking.start_time).toLocaleString()}</p>
                            <p className="booking-detail"><strong>End Time:</strong> {new Date(booking.end_time).toLocaleString()}</p>
                            {/* You can add more details or action buttons like "Cancel Booking" here */}
                            <div className="booking-actions">
                                {/* Example: Link to cancel/edit booking, if you have those routes */}
                                {/* <button onClick={() => handleDeleteBooking(booking.id)} className="action-button delete-button">Cancel Booking</button> */}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-bookings-message">You have no bookings yet. Go book some resources!</p>
            )}
        </div>
    );
}