import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function Home() {
    const { token } = useContext(AppContext);

    const [resources, setResources] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 

    // Use useCallback to memoize the function, good practice for functions in useEffect dependencies
    const getResources = useCallback(async () => {
        setLoading(true); // Start loading
        setError(null);   // Clear previous errors

        if (!token) {
            setError("Authentication token missing. Please log in.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/resources", {
                method: 'GET', 
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            const data = await response.json();

            if (response.ok) {
                
                if (data.success && Array.isArray(data.resources)) {
                    setResources(data.resources);
                } else {
                    // Handle cases where success is false or resources is not an array
                    setError(data.message || "Invalid data format received from server.");
                }
            } else {
                // Handle HTTP errors (e.g., 401, 403, 404, 500)
                setError(data.message || `Failed to fetch resources: ${response.status} ${response.statusText}`);
                console.error("API error:", data);
            }
        } catch (err) {
            // Handle network errors or other exceptions
            setError("An error occurred while fetching resources. Please check your network connection.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false); // End loading
        }
    }, [token]); // Add token to dependency array for useCallback

    useEffect(() => {
        getResources(); 
    }, [getResources]); 

    return (
        <>
            <div className="home-dashboard-section">
                <h1>Available Resources</h1>

                {loading && <p className="loading-message">Loading resources...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && resources.length > 0 ? (
                    <div className="resource-cards-container">
                        {resources.map(resource => (
                            <div key={resource.id} className="resource-card">
                                <h3 className="resource-title">{resource.name}</h3>
                                {/* Assuming 'image' field exists and is a URL */}
                                {//resource.image && (
                                    //<img src={resource.image} alt={resource.name} className="resource-card-image" />
                                //)
                                }
                                <p className="resource-description"><strong>Description:</strong> {resource.description}</p>
                                <p className="resource-location"><strong>Location:</strong> {resource.location}</p>
                                <p className="resource-capacity"><strong>Capacity:</strong> {resource.capacity} people</p>
                                <span className="resource-description">
                                    Availability status: <span className={resource.status === 'available' ? 'status-available' : 'status-booked'}>{resource.status}</span>
                                </span>
                                <Link to={`/resources/${resource.id}`} className="view-details-button">View Details</Link>
                            </div>
                        ))}
                    </div>
                ) : (!loading && !error && (
                    <p className="no-resources-message">No resources available.</p>
                ))}
            </div>
        </>
    );
}