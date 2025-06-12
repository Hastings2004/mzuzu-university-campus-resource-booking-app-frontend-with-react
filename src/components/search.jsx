import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/appContext'; // Adjust path as needed
import moment from 'moment'; // For formatting booking times
import { Link } from 'react-router-dom'; 


export default function GlobalSearch() {
    const { user, token } = useContext(AppContext);

    // States for search parameters
    const [searchType, setSearchType] = useState('resources'); // Default search type
    const [keyword, setKeyword] = useState('');
    const [resourceType, setResourceType] = useState(''); // Only for resources
    const [startTime, setStartTime] = useState(''); // For bookings
    const [endTime, setEndTime] = useState('');     // For bookings
    const [userId, setUserId] = useState(''); // For admin to search bookings/users by user ID (optional)

    // States for results and UI
    const [searchResults, setSearchResults] = useState({ resources: [], bookings: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false); // To show "No results" only after a search

    const isAdmin = user && user.user_type === 'admin';

    // Define resource types for the dropdown (you might fetch this from an API if dynamic)
    const resourceTypes = [
        'Meeting Room', 'Classrooms', 'Vehicle', 'Lab PC', 'Auditorium',
    ];

    // Initialize search type based on admin status
    useEffect(() => {
        if (!isAdmin && searchType === 'users') {
            setSearchType('resources'); // Fallback if non-admin somehow lands on users search
        }
    }, [isAdmin, searchType]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSearchResults({ resources: [], bookings: [], users: [] }); // Clear previous results
        setSearchPerformed(true);

        const queryParams = new URLSearchParams();
        queryParams.append('query', keyword); // The main keyword for global search

        // Additional filters based on selected searchType
        // These are passed to the backend's global search endpoint, which should interpret them
        if (searchType === 'resources' && resourceType) {
            queryParams.append('resource_type', resourceType);
        }
        if (searchType === 'bookings' && startTime) {
            queryParams.append('start_time', startTime);
        }
        if (searchType === 'bookings' && endTime) {
            queryParams.append('end_time', endTime);
        }
        if (isAdmin && userId) { // For admin to filter by user ID (applies to bookings/users)
            queryParams.append('user_id', userId);
        }

        try {
            const response = await fetch(`/api/search/global?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                if (data.results_by_type) {
                    setSearchResults(data.results_by_type);
                } else {
                    setError(data.message || 'Received unexpected data format for global search.');
                }
            } else {
                setError(data.message || 'Failed to perform search.');
                console.error("Global search error:", data);
            }
        } catch (err) {
            setError('Network error or server unavailable.');
            console.error("Global search network error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setKeyword('');
        setResourceType('');
        setStartTime('');
        setEndTime('');
        setUserId('');
        setSearchResults({ resources: [], bookings: [], users: [] });
        setError(null);
        setSearchPerformed(false);
        setSearchType('resources'); // Reset to default search type
    };

    // Helper to format ISO date for datetime-local input (if needed)
    // const getFormattedDateTime = (date) => { ... }; // Not used directly in JSX now, but kept for reference

    return (
        <div className="global-search-container">
            <h2>Global Search</h2>

            <form onSubmit={handleSearch} className="search-form">
                {/* Search Type Selector */}
                <div className="form-group">
                    <label htmlFor="searchType">Search For:</label>
                    <select
                        id="searchType"
                        value={searchType}
                        onChange={(e) => {
                            setSearchType(e.target.value);
                            // Clear type-specific filters when changing search type
                            setResourceType('');
                            setStartTime('');
                            setEndTime('');
                            setUserId('');
                            setSearchResults({ resources: [], bookings: [], users: [] }); // Clear results on type change
                        }}
                    >
                        <option value="resources">Resources</option>
                        <option value="bookings">Bookings</option>
                        {isAdmin && <option value="users">Users</option>}
                    </select>
                </div>

                {/* Keyword Search (always present) */}
                <div className="form-group">
                    <label htmlFor="keyword">Keyword:</label>
                    <input
                        type="text"
                        id="keyword"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder={
                            searchType === 'resources' ? "e.g., Room A, Projector 1" :
                            searchType === 'bookings' ? "e.g., REF-001, Meeting, John" :
                            searchType === 'users' ? "e.g., John Doe, john@example.com" : ""
                        }
                    />
                </div>

                {/* Resource Type (conditional for resources) */}
                {searchType === 'resources' && (
                    <div className="form-group">
                        <label htmlFor="resourceType">Resource Type:</label>
                        <select
                            id="resourceType"
                            value={resourceType}
                            onChange={(e) => setResourceType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            {resourceTypes.map(rType => (
                                <option key={rType} value={rType}>{rType}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Start/End Time (conditional for bookings) */}
                {searchType === 'bookings' && (
                    <>
                        <div className="form-group">
                            <label htmlFor="startTime">Start Time:</label>
                            <input
                                type="datetime-local"
                                id="startTime"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endTime">End Time:</label>
                            <input
                                type="datetime-local"
                                id="endTime"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* User ID filter (optional, for admin only on bookings/users) */}
                {isAdmin && (searchType === 'bookings' || searchType === 'users') && (
                    <div className="form-group">
                        <label htmlFor="userId">User ID (Admin):</label>
                        <input
                            type="text"
                            id="userId"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="Optional: Enter User ID"
                        />
                    </div>
                )}


                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                        Reset
                    </button>
                </div>
            </form>

            {error && <p className="error-message">{error}</p>}

            <div className="search-results">
                <h3>Search Results</h3>
                {loading && <p>Loading results...</p>}
                {!loading && searchPerformed &&
                    searchResults.resources.length === 0 &&
                    searchResults.bookings.length === 0 &&
                    searchResults.users.length === 0 && !error && (
                    <p>No results found matching your criteria.</p>
                )}

                {!loading && searchPerformed && (
                    <>
                        {/* Resources Results */}
                        {searchResults.resources.length > 0 && (
                            <div className="results-section">
                                <h4>Resources ({searchResults.resources.length})</h4>
                                <ul className="resource-list">
                                    {searchResults.resources.map(resource => (
                                        <li key={`resource-${resource.id}`} className="resource-item">
                                            <h5>{resource.name} ({resource.type})</h5>
                                            <p><strong>Location:</strong> {resource.location || 'N/A'}</p>
                                            <p><strong>Capacity:</strong> {resource.capacity || 'N/A'}</p>
                                            <p><strong>Status:</strong> {resource.status}</p>
                                            <p className="text-sm">{resource.description}</p>
                                            <Link to={`/resources/${resource.id}`} className="text-blue-500 block">View Details</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Bookings Results */}
                        {searchResults.bookings.length > 0 && (
                            <div className="results-section">
                                <h4>Bookings ({searchResults.bookings.length})</h4>
                                <ul className="booking-list">
                                    {searchResults.bookings.map(booking => (
                                        <li key={`booking-${booking.id}`} className="booking-item">
                                            <h5>Ref: {booking.booking_reference}</h5>
                                            <p><strong>Resource:</strong> {booking.resource?.name || 'N/A'} ({booking.resource?.type || 'N/A'})</p>
                                            <p><strong>Purpose:</strong> {booking.purpose}</p>
                                            <p><strong>Status:</strong> {booking.status}</p>
                                            <p><strong>Time:</strong> {moment(booking.start_time).format('YYYY-MM-DD HH:mm')} - {moment(booking.end_time).format('YYYY-MM-DD HH:mm')}</p>
                                            {isAdmin && booking.user && (
                                                <p><strong>Booked By:</strong> {booking.user.first_name} {booking.user.last_name} ({booking.user.email})</p>
                                            )}
                                            <Link to={`/booking/${booking.id}`} className="text-blue-500 block">View Details</Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Users Results (Admin only) */}
                        {isAdmin && searchResults.users.length > 0 && (
                            <div className="results-section">
                                <h4>Users ({searchResults.users.length})</h4>
                                <ul className="user-list">
                                    {searchResults.users.map(userResult => (
                                        <li key={`user-${userResult.id}`} className="user-item">
                                            <h5>{userResult.first_name} {userResult.last_name}</h5>
                                            <p><strong>Email:</strong> {userResult.email}</p>
                                            <p><strong>User Type:</strong> {userResult.user_type}</p>
                                            {/* Link to user profile/details, if such a page exists */}
                                            {/* <Link to={`/users/${userResult.id}`} className="text-blue-500 block">View Profile</Link> */}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}