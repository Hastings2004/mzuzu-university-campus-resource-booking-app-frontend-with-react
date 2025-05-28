import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function Show() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AppContext);

    const [resource, setresource] = useState(null);

    async function getresource() {
       
        const res = await fetch(`/api/resources/${id}`, {
            method: 'get',
            headers: {
                Authorization: `Bearer ${token}` // Include token for authenticated access
            }
        });
        const data = await res.json();

        if (res.ok) {
            // Adjust to 'data' if the API returns the resource directly, not { resource: resource }
            setresource(data);
        } else {
            // Handle cases where the resource is not found or API error
            console.error("Failed to fetch resource:", data);
            setresource(null); // Explicitly set to null if not found
        }
    }

    async function handleDelete(e) {
        e.preventDefault();

        
        if (!resource) {
            console.warn("resource data not loaded yet for deletion attempt.");
            return;
        }

        if (user && user.id === resource.user_id) {
            const res = await fetch(`/api/resources/${id}`, { // Corrected endpoint for consistency
                method: "delete",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (res.ok) {
                navigate("/"); // Navigate back to the home page after successful deletion
            } else {
                console.error("Failed to delete resource:", data);
                // Optionally, show an error message to the user
            }
        } else {
            console.warn("User not authorized to delete this resource or resource not found.");
        }
    }

    useEffect(() => {
        getresource();
    }, [id, token]); // Add `id` and `token` to dependencies for re-fetching if they change

    return (
        <>
            <div className="single-resource-container"> {/* Main container for the single resource view */}
                {resource ? (
                    <div key={resource.id} className="single-resource-card"> {/* Card for the single resource */}
                        <h2 className="single-resource-title">{resource.name}</h2> {/* Use resource.name as the main title */}
                        <p className="single-resource-detail"><strong>Description:</strong> {resource.description}</p>
                        <p className="single-resource-detail"><strong>Location:</strong> {resource.location}</p>
                        <p className="single-resource-detail"><strong>Capacity:</strong> {resource.capacity}</p>

                        {/* Assuming these fields exist for a specific 'resource' type resource */}
                        {resource.student_id && <p className="single-resource-detail"><strong>Student ID:</strong> {resource.student_id}</p>}
                        {resource.level && <p className="single-resource-detail"><strong>Level:</strong> {resource.level}</p>}
                        {resource.resource_code && <p className="single-resource-detail"><strong>resource Code:</strong> {resource.resource_code}</p>}
                        {resource.resource_name && <p className="single-resource-detail"><strong>resource Name:</strong> {resource.resource_name}</p>}

                        {/* Action buttons */}
                        {user && user.id === resource.user_id && (
                            <div className="resource-actions">
                                <Link
                                    to={`/resources/update/${resource.id}`}
                                    className="action-button update-button"
                                >
                                    Update
                                </Link>

                                <form onSubmit={handleDelete}>
                                    <button type="submit" className="action-button delete-button">
                                        Delete
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="resource-not-found-message">Loading resource or resource not found!</p>
                )}
            </div>
        </>
    );
}