import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function ViewBooking() {
    const { id } = useParams(); // This 'id' should be the booking ID
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    
    async function getBookingDetails() {
        setLoading(true); // Start loading
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'get',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (res.ok) {
                // Prioritize data.booking or data.data, otherwise assume data itself is the booking
                let receivedBooking = null;
                if (data.booking) {
                    receivedBooking = data.booking;
                } else if (data.data) {
                    receivedBooking = data.data;
                } else {
                    receivedBooking = data; // Assume data itself is the booking object
                }
                // Check if the user is authorized to view this booking
                if (user.user_type !== 'admin' && receivedBooking && receivedBooking.user_id !== user.id) {
                    alert("You are not authorized to view this booking.");
                    navigate("/my-bookings"); // Redirect to a safe page
                    return; // Stop execution
                }

                setBooking(receivedBooking); // Set the booking if authorized
                
            } else {
                console.error("Failed to fetch booking:", data);
                setBooking(null);
                alert(data.message || "Failed to load booking details.");
                navigate("/my-bookings"); // Redirect if booking is not found or unauthorized
            }
        } catch (error) {
            console.error("Error fetching booking details:", error);
            setBooking(null);
            alert("An error occurred while fetching booking details.");
            navigate("/my-bookings"); // Redirect on network error
        } finally {
            setLoading(false); // End loading
        }
    }
    
    async function handleDelete() {
        if (!booking) {
            console.warn("Booking data not loaded yet for deletion attempt.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
            return; // User cancelled
        }

        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                alert(data.message || "Booking deleted successfully!");
                navigate("/booking"); // Redirect to a suitable page after deletion
            } else {
                alert(data.message || "Failed to delete booking.");
                console.error("Failed to delete booking:", data);
            }
        } catch (error) {
            console.error("Network or unexpected error during deletion:", error);
            alert("An unexpected error occurred while deleting the booking. Please try again.");
        }
    }

    useEffect(() => {
        getBookingDetails();
    }, [id, token, user, navigate]); // Added 'user' to dependencies

    if (loading) {
        return (
            <div className="single-resource-container">
                <p>Loading booking details...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="single-resource-container">
                <p className="booking-not-found-message">Booking not found or you are not authorized to view it.</p>
            </div>
        );
    }

    const isOwner = user && booking.user_id && user.id === booking.user_id;
    const isAdmin = user && user.user_type === 'admin';
    const canModify = isOwner || isAdmin;

    return (
        <>
            <div className="single-resource-container">
                <div key={booking.id} className="single-resource-card">
                    <center><h2 className="single-resource-title">{booking.resource?.name}</h2></center>
                    <p className="booking-detail"><strong>Reference number:</strong> {booking.booking_reference}</p>
                    <p className="booking-detail"><strong>Description:</strong>{booking.resource?.description}</p>
                    <p className="booking-detail"><strong>Location:</strong> {booking.resource?.location}</p>
                    <p className="booking-detail"><strong>Capacity:</strong> {booking.resource?.capacity}</p>
                    <p className="booking-detail"><strong>Purpose:</strong> {booking.purpose}</p>
                    <p className="booking-detail"><strong>Start Time:</strong> {new Date(booking.start_time).toLocaleString()}</p>
                    <p className="booking-detail"><strong>End Time:</strong> {new Date(booking.end_time).toLocaleString()}</p>
                    <p className="booking-detail"><strong>Booking Status:</strong>
                        <span className={
                            booking.status === 'approved'
                                ? 'status-approved'
                                : booking.status === 'pending'
                                    ? 'status-pending'
                                    : 'status-rejected'
                        }>
                            {booking.status}
                        </span>
                    </p>

                    {user.user_type === 'admin' && booking.user && (
                        <div>
                            <p className="booking-detail"><strong>Booked by:</strong> {booking.user.first_name + " " + booking.user.last_name}</p>
                            <p className="booking-detail"><strong>Email:</strong> {booking.user.email}</p>
                        </div>
                    )}

                    {canModify && (
                        <div className="booking-actions">
                            <Link to={`/bookings/${booking.id}/edit`} className="button update-button">
                                Update Booking
                            </Link>
                            <button onClick={handleDelete} className="button delete-button">
                                Delete Booking
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}