import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/appContext';
import axios from 'axios'; 

export default function IssueManagementDashboard() {
    const { token, user } = useContext(AppContext);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);

    const fetchIssues = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/resource-issues', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            // Debug: Log the response to see the structure
            console.log('=== API Response Debug ===');
            console.log('Full response:', response);
            console.log('Response data:', response.data);
            console.log('Issues array:', response.data.data);
            
            // Log each issue to see photo field
            if (response.data.data && Array.isArray(response.data.data)) {
                response.data.data.forEach((issue, index) => {
                    console.log(`Issue ${index + 1}:`, {
                        id: issue.id,
                        subject: issue.subject,
                        photo: issue.photo,
                        photo_url: issue.photo_url,
                        image: issue.image,
                        image_url: issue.image_url,
                        full_issue: issue
                    });
                });
            }
            console.log('=== End API Response Debug ===');
            
            setIssues(response.data.data); // Laravel pagination returns 'data' key
        } catch (err) {
            console.error('Error fetching issues:', err);
            setError(err.response?.data?.message || 'Failed to load issues.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && (user?.user_type === 'admin' )) {
            fetchIssues();
        } else if (!user || (user?.user_type !== 'admin')) {
            setError("Unauthorized access. Only admins or facility managers can view this page.");
            setLoading(false);
        }
    }, [token, user]);

    const handleStatusChange = async (issueId, newStatus) => {
        try {
            await axios.put(`/api/resource-issues/${issueId}`, { status: newStatus }, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            // Update the issue in local state
            setIssues(issues.map(issue =>
                issue.id === issueId ? { ...issue, status: newStatus, resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null, resolved_by_user: user } : issue
            ));
        } catch (err) {
            console.error('Error updating issue status:', err);
            setError(err.response?.data?.message || 'Failed to update issue status.');
        }
    };

    const handlePhotoClick = (photoUrl) => {
        setSelectedPhoto(photoUrl);
        setShowPhotoModal(true);
    };

    const closePhotoModal = () => {
        setShowPhotoModal(false);
        setSelectedPhoto(null);
    };

    const filteredIssues = issues.filter(issue => {
        if (filterStatus === 'all') return true;
        return issue.status === filterStatus;
    });

    if (loading) return <div className="loading">Loading issues...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="issue-management-dashboard">
            <h2>Resource Issue Management</h2>

            <div className="filters">
                <label htmlFor="filterStatus">Filter by Status:</label>
                <select id="filterStatus" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="all">All</option>
                    <option value="reported">Reported</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="wont_fix">Won't Fix</option>
                </select>
            </div>

            {filteredIssues.length === 0 ? (
                <p className="no-issues-message">No issues found matching the criteria.</p>
            ) : (
                <table className="issues-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Resource</th>
                            <th>Subject</th>
                            <th>Description</th>
                            <th>Photo</th>
                            <th>Reported By</th>                          
                            <th>Status</th>
                            <th>Reported At</th>
                            <th>Resolved At</th>
                            <th>Resolved By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredIssues.map(issue => (
                            <tr key={issue.id}>
                                <td data-label="ID">{issue.id}</td>
                                <td data-label="Resource">{issue.resource?.name || 'N/A'}</td>
                                <td data-label="Subject">{issue.subject}</td>
                                <td data-label="Description">{issue.description || 'N/A'}</td>
                                <td data-label="Photo">
                                    {(() => {
                                        // Try different possible field names for photo URL
                                        const photoUrl = issue.photo || issue.photo_url || issue.image || issue.image_url;
                                        
                                        if (photoUrl) {
                                            return (
                                                <div className="issue-photo-container">
                                                    <img 
                                                        src={photoUrl} 
                                                        alt="Issue photo" 
                                                        className="issue-photo-thumbnail"
                                                        onClick={() => handlePhotoClick(photoUrl)}
                                                        title="Click to view full size"
                                                        onError={(e) => {
                                                            console.error('Failed to load photo:', photoUrl);
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'block';
                                                        }}
                                                    />
                                                    <span className="photo-error" style={{display: 'none', fontSize: '0.8em', color: 'red'}}>
                                                        Photo failed to load
                                                    </span>
                                                </div>
                                            );
                                        } else {
                                            return <span className="no-photo">No photo</span>;
                                        }
                                    })()}
                                </td>
                                <td data-label="Reported By">
                                    <div>
                                        <strong>{issue.reporter?.first_name+" "+ issue.reporter?.last_name || 'Unknown User'}</strong>
                                        {issue.reporter?.email && (
                                            <div style={{fontSize: '0.9em', color: '#666'}}>
                                                {issue.reporter.email}
                                            </div>
                                        )}
                                    </div>
                                </td>
                               
                                <td data-label="Status">
                                    <span className={`status-badge status-${issue.status.replace(/ /g, '-')}`}>
                                        {issue.status}
                                    </span>
                                </td>
                                <td data-label="Reported At">{new Date(issue.created_at).toLocaleDateString()}</td>
                                <td data-label="Resolved At">{issue.resolved_at ? new Date(issue.resolved_at).toLocaleDateString() : 'N/A'}</td>
                                <td data-label="Resolved By">{issue.resolver?.name || 'N/A'}</td>
                                <td data-label="Actions">
                                    {issue.status !== 'resolved' && issue.status !== 'wont_fix' ? (
                                        <select
                                            value={issue.status}
                                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                            className="status-selector"
                                        >
                                            <option value="reported">Reported</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Mark Resolved</option>
                                            <option value="wont_fix">Won't Fix</option>
                                        </select>
                                    ) : (
                                        <span className="no-action-text">No action needed</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Photo Modal */}
            {showPhotoModal && selectedPhoto && (
                <div className="photo-modal-overlay" onClick={closePhotoModal}>
                    <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="photo-modal-close" onClick={closePhotoModal}>
                            ×
                        </button>
                        <img 
                            src={selectedPhoto} 
                            alt="Issue photo full size" 
                            className="photo-modal-image"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}