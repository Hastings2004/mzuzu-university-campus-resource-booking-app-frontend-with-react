import React, { useState, useContext } from 'react';
import { AppContext } from '../context/appContext'; // Adjust path as needed


export default function ResourceSearch() {
    const { token } = useContext(AppContext);

    const [keyword, setKeyword] = useState('');
    const [type, setType] = useState('');
    const [startTime, setStartTime] = useState(''); // YYYY-MM-DDTHH:MM format
    const [endTime, setEndTime] = useState('');   // YYYY-MM-DDTHH:MM format
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchPerformed, setSearchPerformed] = useState(false); // To show "No results" only after a search

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSearchResults([]); // Clear previous results
        setSearchPerformed(true);

        const queryParams = new URLSearchParams();
        if (keyword) queryParams.append('keyword', keyword);
        if (type) queryParams.append('type', type);
        if (startTime) queryParams.append('start_time', startTime);
        if (endTime) queryParams.append('end_time', endTime);

        try {
            const response = await fetch(`/api/resources/search?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setSearchResults(data.resources || []);
            } else {
                setError(data.message || 'Failed to fetch resources.');
                console.error("Resource search error:", data);
            }
        } catch (err) {
            setError('Network error or server unavailable.');
            console.error("Resource search network error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setKeyword('');
        setType('');
        setStartTime('');
        setEndTime('');
        setSearchResults([]);
        setError(null);
        setSearchPerformed(false);
    };

    // Helper to format ISO date for datetime-local input
    const getFormattedDateTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Define resource types for the dropdown (you might fetch this from an API if dynamic)
    const resourceTypes = [
        'Meeting Room',
        'Projector',
        'Vehicle',
        'Lab PC',
        'Auditorium',
        'Conference Hall',
        // Add more types as per your application's resources
    ];

    return (
        <div className="resource-search-container">
            <h2>Find Resources</h2>
            <form onSubmit={handleSearch} className="search-form">
                <div className="form-group">
                    <label htmlFor="keyword">Keyword (Name/Description):</label>
                    <input
                        type="text"
                        id="keyword"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="e.g., Room A, Projector 1"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="type">Resource Type:</label>
                    <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="">All Types</option>
                        {resourceTypes.map(rType => (
                            <option key={rType} value={rType}>{rType}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="startTime">Available From:</label>
                    <input
                        type="datetime-local"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="endTime">Available Until:</label>
                    <input
                        type="datetime-local"
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Searching...' : 'Search Resources'}
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
                {!loading && searchPerformed && searchResults.length === 0 && !error && (
                    <p>No resources found matching your criteria.</p>
                )}
                {!loading && searchResults.length > 0 && (
                    <ul className="resource-list">
                        {searchResults.map(resource => (
                            <li key={resource.id} className="resource-item">
                                <h4>{resource.name} ({resource.type})</h4>
                                <p><strong>Location:</strong> {resource.location || 'N/A'}</p>
                                <p><strong>Capacity:</strong> {resource.capacity || 'N/A'}</p>
                                <p><strong>Status:</strong> {resource.status}</p>
                                <p>{resource.description}</p>
                                {/* You could add a "Book Now" button here */}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}