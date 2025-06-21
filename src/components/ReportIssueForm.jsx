import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/appContext'; 
import axios from 'axios';

export default function ReportIssueForm({ resourceId, name, onClose, onIssueReported }) {
    const { token, user } = useContext(AppContext);

    // State for text inputs (subject, description, name)
    const [formInputData, setFormInputData] = useState({
        subject: '',
        name: name || '', 
        description: ''
    });
    // State for the file input (photo)
    const [photo, setPhoto] = useState(null);
    
    // State for resources dropdown
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);

    // State for toggle between report form and issues list
    const [showIssues, setShowIssues] = useState(false);
    const [userIssues, setUserIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Fetch resources from database
    const fetchResources = async () => {
        setLoadingResources(true);
        try {
            const response = await axios.get('/api/resources', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && Array.isArray(response.data.resources)) {
                setResources(response.data.resources);
            } else {
                console.error('Invalid resources data format:', response.data);
            }
        } catch (err) {
            console.error('Error fetching resources:', err);
            setError('Failed to load resources. Please try again.');
        } finally {
            setLoadingResources(false);
        }
    };

    // Fetch user's issues
    const fetchUserIssues = async () => {
        setLoadingIssues(true);
        try {
            const response = await axios.get('/api/resource-issues', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                // For non-admin users, filter to show only their own issues
                // For admin users, the backend already filters to show only their issues
                let currentUserIssues;
                if (user?.user_type !== 'admin') {
                    // Non-admin users: filter to show only their own issues
                    currentUserIssues = response.data.data.filter(issue => 
                        issue.reported_by_user_id === user?.id || 
                        issue.reporter?.id === user?.id ||
                        issue.user_id === user?.id
                    );
                } else {
                    // Admin users: backend already filters to show only their issues
                    currentUserIssues = response.data.data;
                }
                setUserIssues(currentUserIssues);
            } else {
                console.error('Invalid user issues data format:', response.data);
                setUserIssues([]);
            }
        } catch (err) {
            console.error('Error fetching user issues:', err);
            setError('Failed to load your issues. Please try again.');
            setUserIssues([]);
        } finally {
            setLoadingIssues(false);
        }
    };

    // Handle toggle between report form and issues list
    const handleToggleView = () => {
        if (!showIssues) {
            // Switching to issues view, fetch user issues
            fetchUserIssues();
        }
        setShowIssues(!showIssues);
        setError(null); // Clear any previous errors
    };

    useEffect(() => {
        console.log('ReportIssueForm props:', {
            resourceId,
            name,
            resourceIdType: typeof resourceId,
            resourceIdValue: resourceId,
            nameType: typeof name,
            nameValue: name
        });
        
        // Fetch resources when component mounts
        if (token) {
            fetchResources();
        }
    }, [resourceId, name, token]);

    // Handles changes for text inputs
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        console.log(`Input changed: ${id} = "${value}"`);
        setFormInputData(prevData => ({
            ...prevData,
            [id]: value
        }));
    };

    // Handles the change for the 'photo' file input
    const handlePhotoChange = (e) => {
        setPhoto(e.target.files[0] || null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('Current form state:', formInputData);

        // Validate required fields on frontend first
        const subjectValue = formInputData.subject?.trim() || '';
        const nameValue = formInputData.name?.trim() || '';

        console.log('Validation check:');
        console.log('Subject:', `"${subjectValue}" (length: ${subjectValue.length})`);
        console.log('Name:', `"${nameValue}" (length: ${nameValue.length})`);

        if (!subjectValue) {
            console.log('❌ Subject validation failed');
            setError('Subject is required and cannot be empty.');
            setLoading(false);
            return;
        }

        if (!nameValue) {
            console.log('❌ Name validation failed');
            setError('Resource name is required and cannot be empty.');
            setLoading(false);
            return;
        }

        try {
            let response;

            if (photo) {
                // If there's a photo, use FormData
                console.log('📸 Sending with photo using FormData');
                const apiFormData = new FormData();
                apiFormData.append('name', nameValue);
                apiFormData.append('subject', subjectValue);
                
                if (formInputData.description?.trim()) {
                    apiFormData.append('description', formInputData.description.trim());
                }
                apiFormData.append('photo', photo);

                console.log('FormData contents:');
                for (let [key, value] of apiFormData.entries()) {
                    console.log(`${key}: "${value}"`);
                }

                response = await axios.post('/api/resource-issues', apiFormData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                       
                    },
                });

                 alert("Report sent successfully ");
            navigator('/');
            } else {
                // If no photo, send as JSON
                console.log('📝 Sending without photo using JSON');
                const requestData = {
                    name: nameValue,
                    subject: subjectValue
                };

                if (formInputData.description?.trim()) {
                    requestData.description = formInputData.description.trim();
                }

                console.log('JSON data being sent:', requestData);

                response = await axios.post('/api/resource-issues', requestData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                 alert("Report sent successfully ");
                navigator('/');
            }
            
            console.log('✅ Success response:', response.data);
            setSuccess(true);
            onIssueReported(response.data.issue); 
           
            
            // Clear the form fields after successful submission
            setFormInputData({
                subject: '',
                name: '',
                description: ''
            });
            setPhoto(null);
            
            // Clear the file input element's value
            const fileInput = document.getElementById('issuePhotoInput');
            if (fileInput) {
                fileInput.value = '';
            }
            
            setTimeout(onClose, 2000);
        } catch (err) {
            console.error('❌ Error reporting issue:', err);
            console.error('❌ Error response:', err.response?.data);
            console.error('❌ Error status:', err.response?.status);
            
            // Handle and display specific validation errors from Laravel
            if (err.response && err.response.data && err.response.data.errors) {
                const errors = err.response.data.errors;
                console.log('❌ Validation errors:', errors);
                let errorMessage = 'Validation errors:\n';
                for (const key in errors) {
                    errorMessage += `• ${key}: ${errors[key].join(', ')}\n`;
                }
                setError(errorMessage.trim());
            } else if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } 
        } finally {
            setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return { color: '#856404', backgroundColor: '#fff3cd' };
            case 'in_progress':
                return { color: '#0c5460', backgroundColor: '#d1ecf1' };
            case 'resolved':
                return { color: '#155724', backgroundColor: '#d4edda' };
            case 'closed':
                return { color: '#721c24', backgroundColor: '#f8d7da' };
            default:
                return { color: '#6c757d', backgroundColor: '#f8f9fa' };
        }
    };

    return (
        <div className="report-issue-form-container">
            <div className="header-section">
                <h3>{showIssues ? 'My Reported Issues' : `Report Issue for: ${name}`}</h3>
                <button
                    type="button"
                    onClick={handleToggleView}
                    className={`toggle-button ${showIssues ? 'report-new' : 'show-issues'}`}
                >
                    {showIssues ? 'Report New Issue' : 'Show My Issues'}
                </button>
            </div>
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {showIssues ? (
                // Issues List View
                <div className="issues-list-container">
                    {loadingIssues ? (
                        <p className="loading-message">Loading your issues...</p>
                    ) : userIssues.length > 0 ? (
                        <div className="issues-list">
                            {userIssues.map((issue, index) => (
                                <div key={issue.id || index} className="issue-item">
                                    <div className="issue-header">
                                        <h4 className="issue-title">{issue.subject}</h4>
                                        <span className={`issue-status ${issue.status}`}>
                                            {issue.status?.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    <div className="issue-details">
                                        <div className="issue-detail">
                                            <strong>Resource:</strong> {issue.name}
                                        </div>
                                        
                                        {issue.description && (
                                            <div className="issue-detail">
                                                <strong>Description:</strong> {issue.description}
                                            </div>
                                        )}
                                        
                                        <div className="issue-detail">
                                            <strong>Reported:</strong> {formatDate(issue.created_at)}
                                        </div>
                                        
                                        {issue.updated_at !== issue.created_at && (
                                            <div className="issue-detail">
                                                <strong>Last Updated:</strong> {formatDate(issue.updated_at)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {issue.photo && (
                                        <div className="issue-photo">
                                            <p><strong>Attached Photo:</strong></p>
                                            <img 
                                                src={issue.photo} 
                                                alt="Issue photo" 
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-issues-message">
                            You haven't reported any issues yet.
                        </p>
                    )}
                </div>
            ) : (
                // Report Form View
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="subject">
                            Subject: <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={formInputData.subject}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g. Room is dirty"
                            disabled={loading}
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="name">
                            Resource Name: <span className="required">*</span>
                        </label>
                        {loadingResources ? (
                            <select disabled>
                                <option>Loading resources...</option>
                            </select>
                        ) : (
                            <select
                                id="name"
                                value={formInputData.name}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            >
                                <option value="">Select a resource</option>
                                {resources.map(resource => (
                                    <option key={resource.id} value={resource.name}>
                                        {resource.name} - {resource.location} (Capacity: {resource.capacity})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            value={formInputData.description}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Provide more details about the issue..."
                            disabled={loading}
                        ></textarea>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="issuePhotoInput">Attach Photo (Optional):</label>
                        <input
                            type="file"
                            id="issuePhotoInput"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            disabled={loading}
                        />
                        {photo && (
                            <p className="file-selected">
                                Selected: {photo.name}
                            </p>
                        )}
                    </div>
                    
                    {success && (
                        <div className="success-message">
                            Issue reported successfully!
                        </div>
                    )}
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            disabled={loading || !formInputData.subject?.trim() || !formInputData.name?.trim()}
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}