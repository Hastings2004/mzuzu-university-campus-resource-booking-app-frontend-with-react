import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/appContext'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ReportIssueForm({ resourceId, name, onClose, onIssueReported }) {
    const { token, user } = useContext(AppContext);
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState({
        subject: '',
        name: name || '',
        description: ''
    });
    
    // Form validation errors
    const [errors, setErrors] = useState({});
    
    // File state
    const [photo, setPhoto] = useState(null);
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Resources dropdown state
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);

    // Issues list state
    const [showIssues, setShowIssues] = useState(false);
    const [userIssues, setUserIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(false);

    // Fetch resources for dropdown
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
                let currentUserIssues;
                if (user?.user_type !== 'admin') {
                    currentUserIssues = response.data.data.filter(issue => 
                        issue.reported_by_user_id === user?.id || 
                        issue.reporter?.id === user?.id ||
                        issue.user_id === user?.id
                    );
                } else {
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

    // Handle form input changes
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[id]) {
            setErrors(prev => ({
                ...prev,
                [id]: null
            }));
        }
        
        // Clear general error when user makes changes
        if (error) {
            setError(null);
        }
    };

    // Handle photo selection
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        
        // Validate file type and size
        if (file) {
            // Check file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                setError('Please select a valid image file (JPEG, PNG, or GIF).');
                e.target.value = '';
                return;
            }
            
            // Check file size (2MB = 2 * 1024 * 1024 bytes)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                setError('Image size must be less than 2MB.');
                e.target.value = '';
                return;
            }
            
            console.log('Selected file:', {
                name: file.name,
                type: file.type,
                size: file.size,
                sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
            });
        }
        
        setPhoto(file);
        
        // Clear photo-related errors
        if (errors.photo) {
            setErrors(prev => ({
                ...prev,
                photo: null
            }));
        }
        
        // Clear general error when user selects a file
        if (error) {
            setError(null);
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        // Validate subject
        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required.';
        }

        // Validate resource name
        if (!formData.name.trim()) {
            newErrors.name = 'Resource name is required.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        // Debug: Log authentication info
        console.log('=== Authentication Debug ===');
        console.log('User:', user);
        console.log('Token exists:', !!token);
        console.log('ResourceId:', resourceId);
        console.log('Name prop:', name);
        console.log('=== End Authentication Debug ===');

        try {
            // Clean the resource name - extract just the name if it contains extra text
            let cleanResourceName = formData.name.trim();
            if (cleanResourceName.includes(' - ')) {
                cleanResourceName = cleanResourceName.split(' - ')[0].trim();
            }

            let response;

            if (photo) {
                // Send with photo using FormData and fetch (not axios)
                const apiFormData = new FormData();
                
                // Add all required fields
                apiFormData.append('name', cleanResourceName);
                apiFormData.append('subject', formData.subject.trim());
                
                if (formData.description?.trim()) {
                    apiFormData.append('description', formData.description.trim());
                }
                
                // Add resource_id if available
                if (resourceId) {
                    apiFormData.append('resource_id', resourceId.toString());
                }
                
                // Add user_id if available
                if (user?.id) {
                    apiFormData.append('user_id', user.id.toString());
                }
                
                apiFormData.append('photo', photo);

                // Debug: Log FormData contents
                console.log('=== FormData being sent ===');
                console.log('name:', cleanResourceName);
                console.log('subject:', formData.subject.trim());
                console.log('description:', formData.description?.trim() || 'null');
                console.log('resource_id:', resourceId || 'null');
                console.log('user_id:', user?.id || 'null');
                console.log('photo:', photo.name);
                console.log('photo type:', photo.type);
                console.log('photo size:', photo.size);
                console.log('=== End FormData ===');

                // Debug: Log FormData entries
                console.log('=== FormData entries ===');
                for (let [key, value] of apiFormData.entries()) {
                    if (value instanceof File) {
                        console.log(`${key}:`, {
                            name: value.name,
                            type: value.type,
                            size: value.size
                        });
                    } else {
                        console.log(`${key}:`, value);
                    }
                }
                console.log('=== End FormData entries ===');

                // Use fetch instead of axios for file uploads
                const fetchResponse = await fetch('/api/resource-issues', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Don't set Content-Type - let browser set it with boundary for FormData
                    },
                    body: apiFormData
                });

                console.log('=== Fetch Response Debug ===');
                console.log('Response status:', fetchResponse.status);
                console.log('Response headers:', Object.fromEntries(fetchResponse.headers.entries()));
                console.log('=== End Fetch Response Debug ===');

                if (!fetchResponse.ok) {
                    const errorData = await fetchResponse.json();
                    console.log('Error response data:', errorData);
                    throw { response: { data: errorData, status: fetchResponse.status } };
                }

                response = { data: await fetchResponse.json() };
            } else {
                // Send as JSON using axios
                const requestData = {
                    name: cleanResourceName,
                    subject: formData.subject.trim()
                };

                if (formData.description?.trim()) {
                    requestData.description = formData.description.trim();
                }

                // Add resource_id if available
                if (resourceId) {
                    requestData.resource_id = resourceId.toString();
                }

                // Add user_id if available
                if (user?.id) {
                    requestData.user_id = user.id.toString();
                }

                // Debug: Log JSON data
                console.log('=== JSON data being sent ===');
                console.log('requestData:', requestData);
                console.log('=== End JSON data ===');

                response = await axios.post('/api/resource-issues', requestData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            // Handle success
            setSuccess(true);
            onIssueReported(response.data.issue);
            
            // Clear form
            setFormData({
                subject: '',
                name: name || '',
                description: ''
            });
            setPhoto(null);
            
            // Clear file input
            const fileInput = document.getElementById('issuePhotoInput');
            if (fileInput) {
                fileInput.value = '';
            }

            // Show success message and navigate
            alert('Issue reported successfully!');
            navigate('/');
            
        } catch (err) {
            console.error('Error reporting issue:', err);
            console.error('Error response data:', err.response?.data);
            console.error('Error status:', err.response?.status);
            
            // Handle validation errors from backend
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                console.log('Backend validation errors:', backendErrors);
                setErrors(backendErrors);
                
                // Create a detailed error message
                let errorMessage = 'Validation errors:\n';
                for (const [field, messages] of Object.entries(backendErrors)) {
                    if (Array.isArray(messages)) {
                        errorMessage += `• ${field}: ${messages.join(', ')}\n`;
                    } else {
                        errorMessage += `• ${field}: ${messages}\n`;
                    }
                }
                setError(errorMessage.trim());
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to report issue. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle toggle between report form and issues list
    const handleToggleView = () => {
        if (!showIssues) {
            fetchUserIssues();
        }
        setShowIssues(!showIssues);
        setError(null);
        setErrors({});
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

    useEffect(() => {
        if (token) {
            fetchResources();
        }
    }, [token]);

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
                                value={formData.name}
                                onChange={handleInputChange}
                                className={errors.name ? 'error' : ''}
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
                        {errors.name && <p className="error-message">{errors.name}</p>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="subject">
                            Subject: <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            placeholder="e.g., Projector not working"
                            className={errors.subject ? 'error' : ''}
                            disabled={loading}
                        />
                        {errors.subject && <p className="error-message">{errors.subject}</p>}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="description">Description (Optional):</label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows="4"
                            placeholder="Provide more details about the issue..."
                            disabled={loading}
                        ></textarea>
                        {errors.description && <p className="error-message">{errors.description}</p>}
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
                        {errors.photo && <p className="error-message">{errors.photo}</p>}
                    </div>
                    
                    {success && (
                        <div className="success-message">
                            Issue reported successfully!
                        </div>
                    )}
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="submit-button"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            disabled={loading}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
} 