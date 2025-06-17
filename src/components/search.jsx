import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/appContext';
import moment from 'moment';
import { Link } from 'react-router-dom';

export default function GlobalSearch() {
    const { user, token } = useContext(AppContext);

    // States for search parameters
    const [searchType, setSearchType] = useState('resources');
    const [keyword, setKeyword] = useState('');
    const [resourceType, setResourceType] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [userId, setUserId] = useState('');

    // States for results and UI
    const [searchResults, setSearchResults] = useState({ resources: [], bookings: [], users: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false); // Still useful for initial empty state vs "no results"

    const isAdmin = user && user.user_type === 'admin';

    const resourceTypes = [
        'Meeting Room', 'Classrooms', 'Vehicle', 'ICT LABS', 'Auditorium',
    ];

    // Initialize search type based on admin status
    useEffect(() => {
        if (!isAdmin && searchType === 'users') {
            setSearchType('resources');
        }
    }, [isAdmin, searchType]);

    // Function to perform the search (now standalone, not an event handler)
    const performSearch = async () => {
        if (!token) { // Ensure token is available before searching
            setError("Authentication token missing.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setSearchResults({ resources: [], bookings: [], users: [] });
        setSearchPerformed(true); // Indicate that a search has been attempted

        const queryParams = new URLSearchParams();
        // Only append keyword if it's not empty, to avoid sending "?query="
        if (keyword.trim()) {
            queryParams.append('query', keyword.trim());
        }

        if (searchType === 'resources' && resourceType) {
            queryParams.append('resource_type', resourceType);
        }
        if (searchType === 'bookings' && startTime) {
            queryParams.append('start_time', startTime);
        }
        if (searchType === 'bookings' && endTime) {
            queryParams.append('end_time', endTime);
        }
        if (isAdmin && userId) {
            queryParams.append('user_id', userId);
        }

        // Only make API call if there's at least one search parameter
        // This prevents immediate empty searches on component mount, unless desired.
        const hasSearchParams = keyword.trim() || resourceType || startTime || endTime || userId;

        if (!hasSearchParams && searchType !== 'resources') { // Allow initial search for all resources if no params
            setLoading(false);
            setSearchResults({ resources: [], bookings: [], users: [] });
            return;
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

    // New useEffect for automatic search on parameter change
    useEffect(() => {
        // Debounce mechanism
        const handler = setTimeout(() => {
            // Only trigger search if at least one parameter has a value,
            // or if the search type changes (to get initial data for that type)
            const hasCriteria = keyword.trim() || resourceType || startTime || endTime || userId;
            if (hasCriteria || searchPerformed) { // Also search if `searchPerformed` is true (e.g., after reset)
                performSearch();
            }
        }, 500); // 500ms debounce time

        // Cleanup function to clear the timeout if the component unmounts
        // or if the dependencies change before the timeout fires
        return () => {
            clearTimeout(handler);
        };
    }, [
        keyword,
        searchType,
        resourceType,
        startTime,
        endTime,
        userId,
        token, // Add token as a dependency to re-run if it changes (e.g., after login)
        isAdmin, // Add isAdmin as a dependency
    ]);


    const handleReset = () => {
        setKeyword('');
        setResourceType('');
        setStartTime('');
        setEndTime('');
        setUserId('');
        setSearchResults({ resources: [], bookings: [], users: [] });
        setError(null);
        setSearchPerformed(false); // Reset searchPerformed on full reset
        setSearchType('resources'); // Reset to default search type
    };


    return (
        <div className="global-search-container">
            <h2>Global Search</h2>

            {/* Remove onSubmit from form as we're using useEffect for auto-search */}
            <div className="search-form">
                {/* Search Type Selector */}
                <div className="form-group">
                    <label htmlFor="searchType">Search For:</label>
                    <select
                        id="searchType"
                        value={searchType}
                        onChange={(e) => {
                            setSearchType(e.target.value);
                            // Clear related filters when search type changes
                            setResourceType('');
                            setStartTime('');
                            setEndTime('');
                            setUserId('');
                            setKeyword(''); // Also clear keyword for a fresh start with new search type
                            // No need to clear searchResults here, useEffect will handle re-search
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
                            searchType === 'resources' ? "e.g., Room A, ICT LAB 1" :
                            searchType === 'bookings' ? "e.g., MZUNI-RBA-001, Meeting, John" :
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
                    {/* The search button is removed because the search is automatic */}
                    <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={loading}>
                        Reset
                    </button>
                </div>
            </div> {/* End of search-form div */}

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