import { useCallback, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/appContext";

export default function Home() {
    const { token } = useContext(AppContext);

    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("all"); // New state for selected category
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const resourcesPerPage = 16;

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

    const [news, setNews] = useState([]);

    const getNews = useCallback(async () => {
        try {
            const response = await fetch('/api/news', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            // Handle different possible response structures
            if (response.ok) {
                // Check if data is an array directly
                if (Array.isArray(data)) {
                    setNews(data);
                }
                // Check if data has a 'data' property that's an array (common Laravel pattern)
                else if (data.data && Array.isArray(data.data)) {
                    setNews(data.data);
                }
                // Check if data has a 'news' property that's an array
                else if (data.news && Array.isArray(data.news)) {
                    setNews(data.news);
                }
                // If none of the above, set empty array to prevent errors
                else {
                    console.warn('Unexpected news API response format:', data);
                    setNews([]);
                }
            } else {
                console.error('Failed to fetch news:', data);
                setNews([]);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
            setNews([]);
        }
    }, []);

    useEffect(() => {
        getNews();
    }, [getNews]);

    const getResources = useCallback(async () => {
        setLoading(true);
        setError(null);
        // Reset to first page when category changes
        setCurrentPage(1);

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

    // Pagination logic
    const indexOfLastResource = currentPage * resourcesPerPage;
    const indexOfFirstResource = indexOfLastResource - resourcesPerPage;
    const currentResources = resources.slice(indexOfFirstResource, indexOfLastResource);
    const totalPages = Math.ceil(resources.length / resourcesPerPage);

    // Handle category change
    const handleCategoryChange = (categoryValue) => {
        setSelectedCategory(categoryValue);
    };

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <>
            <div className="home-dashboard-section">                
                <div>
                    <h1>Available Resources</h1>
               </div>               

                {/* Category Filter Section */}
                <div className="category-filter-container">
                    <label htmlFor="category-select" className="category-filter-label">Filter by Category:</label>
                    <select
                        id="category-select"
                        className="category-dropdown"
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        aria-label="Select resource category"
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
                    <>
                        <div className="resource-cards-container">
                            {currentResources.map(resource => {
                                // Prioritize image_url since it contains the full URL
                                const imageUrl = resource.image_url || resource.image || resource.photo || resource.photo_url || resource.image_path;
                                return (
                                    <div key={resource.id} className="resource-card">
                                        <h3 className="resource-title">{resource.name}</h3>

                                        {/* Resource Image */}
                                        <div className="resource-image-container">
                                            {imageUrl ? (
                                                <img 
                                                    src={imageUrl} 
                                                    alt={resource.name} 
                                                    className="resource-card-image"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'block';
                                                    }}
                                                />
                                            ) : null}
                                            {(!imageUrl || imageUrl === '') && (
                                                <div className="resource-image-placeholder">
                                                    <span className="placeholder-icon">📷</span>
                                                    <span className="placeholder-text">No Image</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="resource-description"><strong><i className="bx bx-info-circle"></i> Description:</strong> {resource.description}</p>
                                        <p className="resource-location"><strong><i className="bx bx-been-here"></i> Location:</strong> {resource.location}</p>
                                        <p className="resource-capacity"><strong><i className="bx bx-group"></i> Capacity:</strong> {resource.capacity} people</p>

                                        <Link to={`/resources/${resource.id}`} className="view-details-button">View Details</Link>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination-container">
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                                    <button
                                        key={pageNum}
                                        className={`pagination-btn${currentPage === pageNum ? ' active' : ''}`}
                                        onClick={() => handlePageChange(pageNum)}
                                        disabled={currentPage === pageNum}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (!loading && !error && (
                    <p className="no-resources-message">No resources available for this category.</p>
                ))}
            </div>
        </>
    );
}