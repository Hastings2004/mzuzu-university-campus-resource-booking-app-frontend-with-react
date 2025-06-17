import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/appContext';
import axios from 'axios'; 

export default function IssueManagementDashboard() {
    const { token, user } = useContext(AppContext);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchIssues = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('/api/resource-issues', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
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
                            <th>Reported By</th>
                            <th>Photo</th>
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
                                <td data-label="Resource">{issue.resource.name}</td>
                                <td data-label="Subject">{issue.subject}</td>
                                <td data-label="Description">{issue.description || 'N/A'}</td>
                                <td data-label="Reported By">{issue.reporter.name}</td>
                                <td data-label="Photo">
                                    {issue.photo_path ? (
                                        <a href={`/storage/${issue.photo_path}`} target="_blank" rel="noopener noreferrer" className="view-photo-link">View Photo</a>
                                    ) : 'N/A'}
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
                                    {/* Optionally add a delete button */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}