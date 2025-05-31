import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function View() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const [resource, setResource] = useState(null);
    // New state variables for booking form
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [purpose, setPurpose] = useState("");
    const [bookingMessage, setBookingMessage] = useState(""); // For success/error messages

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
        } else {
            console.error("Failed to fetch resource:", data);
            setResource(null);
        }
    }

    // Function to handle booking submission
    async function handleSubmitBooking(e) {
        e.preventDefault(); 
        setBookingMessage(""); 

        if (!user) {
            setBookingMessage("You must be logged in to book a resource.");
            return;
        }

        if (!resource) {
            setBookingMessage("Resource data not loaded yet.");
            return;
        }

        if (!startTime || !endTime || !purpose) {
            setBookingMessage("Please fill in all booking details (Start Time, End Time, Purpose).");
            return;
        }

        // Basic time validation (you might want more robust validation)
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            setBookingMessage("End time must be after start time.");
            return;
        }

        const bookingData = {
            //user_id: user.id,
            resource_id: resource.id, // <--- Make sure this is present and correct
            start_time: startTime,
            end_time: endTime,
            purpose: purpose,
            status: "pending"
        };

        try {
            const res = await fetch("/api/bookings", { // Assuming your backend API for bookings is /api/bookings
                method: "POST",
                headers: {
                    
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });

            const data = await res.json();

            if (res.ok) {
                setBookingMessage("Booking request submitted successfully! Status: " + bookingData.status);
                setStartTime("");
                setEndTime("");
                setPurpose("");
                
            } else {
                setBookingMessage(`Failed to submit booking: ${data.message || 'Unknown error'}`);
                console.error("Booking error:", data);
            }
        } catch (error) {
            setBookingMessage("An error occurred during booking. Please try again.");
            console.error("Network or fetch error:", error);
        }
    }

    
    async function handleDelete(e) {
        e.preventDefault();

        if (!resource) {
            console.warn("Resource data not loaded yet for deletion attempt.");
            return;
        }

        if (user && resource.user_id && user.id === resource.user_id) {
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
                console.error("Failed to delete resource:", data);
            }
        } else {
            console.warn("User not authorized to delete this resource or resource not found.");
        }
    }


    useEffect(() => {
        getResource();
    }, [id, token]);

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
                                    Availability status: <span className={resource.status === 'available' ? 'status-available' : 'status-booked'}>{resource.status}</span>
                        </span>
                        
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
                                    </div>
                                    <button type="submit" className="action-button book-button">
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