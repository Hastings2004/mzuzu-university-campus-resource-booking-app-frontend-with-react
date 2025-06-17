import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/appContext'; 
import axios from 'axios';

export default function ReportIssueForm({ resourceId, name, onClose, onIssueReported }) {
    const { token } = useContext(AppContext);

    // State for text inputs (subject, description, name)
    const [formInputData, setFormInputData] = useState({
        subject: '',
        name: name || '', // Initialize with the passed name prop
        description: ''
    });
    // State for the file input (photo)
    const [photo, setPhoto] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Debug: Log props when component mounts
    useEffect(() => {
        console.log('ReportIssueForm props:', {
            resourceId,
            name,
            resourceIdType: typeof resourceId,
            resourceIdValue: resourceId,
            nameType: typeof name,
            nameValue: name
        });
    }, [resourceId, name]);

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
                        // Let axios set Content-Type for FormData
                    },
                });
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
            } else {
                setError('Failed to report issue. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-issue-form-container">
            <h3>Report Issue for: {name}</h3>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="subject">Subject: <span style={{color: 'red'}}>*</span></label>
                    <input
                        type="text"
                        id="subject"
                        value={formInputData.subject}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Projector not working, Room is dirty"
                        disabled={loading}
                    />
                    <small style={{color: '#666', fontSize: '0.8em'}}>
                        Current value: "{formInputData.subject}" (length: {formInputData.subject?.length || 0})
                    </small>
                </div>
                
                <div className="form-group">
                    <label htmlFor="name">Resource Name: <span style={{color: 'red'}}>*</span></label>
                    <input
                        type="text"
                        id="name"
                        value={formInputData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter the exact resource name from database"
                        disabled={loading}
                    />
                    <small style={{color: '#666', fontSize: '0.8em'}}>
                        Current value: "{formInputData.name}" (length: {formInputData.name?.length || 0})
                    </small>
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
                        <p style={{fontSize: '0.9em', color: '#666', marginTop: '5px'}}>
                            Selected: {photo.name}
                        </p>
                    )}
                </div>
                
                {error && (
                    <div className="error-message" style={{
                        whiteSpace: 'pre-line', 
                        background: '#ffebee', 
                        padding: '10px', 
                        borderRadius: '4px',
                        border: '1px solid #ffcdd2',
                        color: '#c62828'
                    }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="success-message" style={{
                        background: '#e8f5e8', 
                        padding: '10px', 
                        borderRadius: '4px',
                        border: '1px solid #4caf50',
                        color: '#2e7d32'
                    }}>
                        Issue reported successfully!
                    </div>
                )}
                
                <div className="form-actions">
                    <button 
                        type="submit" 
                        disabled={loading || !formInputData.subject?.trim() || !formInputData.name?.trim()}
                        style={{
                            padding: '10px 20px',
                            marginRight: '10px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        disabled={loading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}