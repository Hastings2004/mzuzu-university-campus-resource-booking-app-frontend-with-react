import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function Home() {
    const { token } = useContext(AppContext);

    const [resources, setresources] = useState([]);

    async function getresources() {
        const response = await fetch("/api/resources", {
            method: 'get',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            setresources(data);
        }
    }

    useEffect(() => {
        getresources();
    }, []);

    return (
        <>
            {/* The #content main in your CSS already handles padding and overflow.
                So, this div just needs to organize the internal elements. */}
            <div className="home-dashboard-section">
                <h1>Available Resources</h1>

                {resources.length > 0 ? (
                    <div className="resource-cards-container"> {/* Container for the cards */}
                        {resources.map(resource => (
                            <div key={resource.id} className="resource-card"> {/* Individual card */}
                                <h3 className="resource-title">{resource.name}</h3>
                                <p className="resource-description"><strong>Description:</strong> {resource.description}</p>
                                <p className="resource-location"><strong>Location:</strong> {resource.location}</p>
                                <p className="resource-capacity"><strong>Capacity:</strong> {resource.capacity} people</p>
                                <Link to={`/resources/${resource.id}`} className="view-details-button">View Details</Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-resources-message">No resources available.</p>
                )}
            </div>
        </>
    );
}