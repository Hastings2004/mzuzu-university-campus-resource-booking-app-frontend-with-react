import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function Home() {
    const { token } = useContext(AppContext);

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all"); // New state for selected category

    // Define categories
    const categories = [
        { name: "All", value: "all" },
        { name: "Classrooms", value: "classrooms" },
        { name: "ICT Labs", value: "ict_labs" },
        { name: "Science Labs", value: "science_labs" },
        { name: "Auditorium", value: "auditorium" },
        { name: "Sports", value: "sports" },
        { name: "Cars", value: "cars" },
    ];

    const getResources = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!token) {
            setError("Authentication token missing. Please log in.");
            setLoading(false);
            return;
        }

        try {
            // Construct API URL with category filter
            let apiUrl = "/api/resources";
            if (selectedCategory !== "all") {
                apiUrl = `/api/resources?category=${selectedCategory}`;
            }

            const response = await fetch(apiUrl, {
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
                    setError(data.message || "Invalid data format received from server.");
                }
            } else {
                setError(data.message || `Failed to fetch resources: ${response.status} ${response.statusText}`);
                console.error("API error:", data);
            }
        } catch (err) {
            setError("An error occurred while fetching resources. Please check your network connection.");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [token, selectedCategory]); // Add selectedCategory to dependency array

    useEffect(() => {
        getResources();
    }, [getResources]);

    // Handle category change
    const handleCategoryChange = (categoryValue) => {
        setSelectedCategory(categoryValue);
    };

    return (
        <>
            <div className="home-dashboard-section">
                <h1>Available Resources</h1>

                {/* Category Filter Section */}
                <div className="category-filter-container">
                    <label htmlFor="category-select">Filter by Category:</label>
                    <select
                        id="category-select"
                        className="category-dropdown"
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                        {categories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                   
                </div>

                {loading && <p className="loading-message">Loading resources...</p>}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && resources.length > 0 ? (
                    <div className="resource-cards-container">
                        {resources.map(resource => (
                            <div key={resource.id} className="resource-card">
                                <h3 className="resource-title">{resource.name}</h3>

                                {/* You can uncomment this if you have resource images */}
                                {/* {resource.image && (
                                    <img src={resource.image} alt={resource.name} className="resource-card-image" />
                                )} */}

                                <p className="resource-description"><strong>Description:</strong> {resource.description}</p>
                                <p className="resource-location"><strong>Location:</strong> {resource.location}</p>
                                <p className="resource-capacity"><strong>Capacity:</strong> {resource.capacity} people</p>

                                <Link to={`/resources/${resource.id}`} className="view-details-button">View Details</Link>
                            </div>
                        ))}
                    </div>
                ) : (!loading && !error && (
                    <p className="no-resources-message">No resources available for this category.</p>
                ))}
            </div>
        </>
    );
}