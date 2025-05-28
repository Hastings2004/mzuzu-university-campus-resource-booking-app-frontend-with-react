import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function ViewBooking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const [booking, setBooking] = useState(null);
    
    async function getResource() {
        const res = await fetch(`/api/bookings/${id}`, {
            method: 'get',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await res.json();

        if (res.ok) {
           
            if (data.booking) {
                setBooking(data.booking);
            } else if (data.data) {
                setBooking(data.data);
            } else {
                setBooking(data);
            }
        } else {
            console.error("Failed to fetch booking:", data);
            setBooking(null);
        }
    }
   
    async function handleDelete(e) {
        e.preventDefault();

        if (!booking) {
            console.warn("Booking data not loaded yet for deletion attempt.");
            return;
        }

        if (user && booking.user_id && user.id === booking.user_id) {
            const res = await fetch(`/api/resources/${id}`, {
                method: "delete",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                navigate("/");
            } else {
                console.error("Failed to delete booking:", data);
            }
        } else {
            console.warn("User not authorized to delete this booking or booking not found.");
        }
    }


    useEffect(() => {
        getResource();
    }, [id, token]);

    return (
        <>
            <div className="single-resource-container">
                {booking ? (
                    <div key={booking.id} className="single-resource-card">
                        <center><h2 className="single-resource-title">{booking.resource.name}</h2></center>
                        <p className="booking-detail"><strong>Description:</strong>{booking.resource.description}</p>
                        <p className="booking-detail"><strong>Location:</strong> {booking.resource.location}</p>
                        <p className="booking-detail"><strong>Capacity:</strong> {booking.resource.capacity}</p>
                        <p className="booking-detail"><strong>Purpose:</strong> {booking.purpose}</p>
                        <p className="booking-detail"><strong>Start Time:</strong> {new Date(booking.start_time).toLocaleString()}</p>
                        <p className="booking-detail"><strong>End Time:</strong> {new Date(booking.end_time).toLocaleString()}</p>


                        
                    </div>
                ) : (
                    <p className="booking-not-found-message">Loading Booking or Booking not found!</p>
                )}
            </div>
        </>
    );
}