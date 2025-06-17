import React, { useState, useContext } from 'react';
import { AppContext } from '../context/appContext'; 
import axios from 'axios'; // axios is necessary for FormData/file uploads

export default function ReportIssueForm({ resourceId, resourceName, onClose, onIssueReported }) {
    const { token } = useContext(AppContext);

    // State for text inputs (subject, description)
    const [formInputData, setFormInputData] = useState({
        subject: '',
        description: ''
    });
    // State for the file input (photo)
    const [photo, setPhoto] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Handles changes for 'subject' and 'description' inputs
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormInputData(prevData => ({
            ...prevData,
            [id]: value
        }));
    };

    // Handles the change for the 'photo' file input
    const handlePhotoChange = (e) => {
        // e.target.files is a FileList, we want the first file
        setPhoto(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null); // Clear previous errors
        setSuccess(false); // Clear previous success

        // FormData is used to send file uploads along with other data
        const apiFormData = new FormData();
        
        // Append required fields first
        apiFormData.append('resource_id', resourceId);
        apiFormData.append('subject', formInputData.subject);
        
        // Append optional fields only if they have a value
        if (formInputData.description) {
            apiFormData.append('description', formInputData.description);
        }
        if (photo) {
            apiFormData.append('photo', photo);
        }

        try {
            const response = await axios.post('/api/resource-issues', apiFormData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                   
                },
            });
            
            setSuccess(true);
            onIssueReported(response.data.issue); 
            // Clear the form fields after successful submission
            setFormInputData({
                subject: '',
                description: ''
            });
            setPhoto(null); // Clear the photo state
            // Manually clear the file input element's value for a clean state
            document.getElementById('issuePhotoInput').value = ''; 
            
            setTimeout(onClose, 2000); // Close the form/modal after a delay
        } catch (err) {
            console.error('Error reporting issue:', err);
            // Handle and display specific validation errors from Laravel
            if (err.response && err.response.data && err.response.data.errors) {
                const errors = err.response.data.errors;
                let errorMessage = 'Please correct the following issues:\n';
                for (const key in errors) {
                    // Join multiple error messages for a single field with a comma
                    errorMessage += `- ${key}: ${errors[key].join(', ')}\n`;
                }
                setError(errorMessage.trim()); // Trim any trailing newline
            } else {
                // Fallback for other types of errors (e.g., network issues, server errors)
                setError(err.response?.data?.message || 'Failed to report issue. Please check your connection and try again.');
            }
        } finally {
            setLoading(false); // Stop loading regardless of success or failure
        }
    };

    return (
        <div className="report-issue-form-container">
            <h3>Report Issue for: {resourceName}</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="subject">Subject:</label>
                    <input
                        type="text"
                        id="subject" // ID matches the key in formInputData
                        value={formInputData.subject}
                        onChange={handleInputChange}
                        required // HTML5 required attribute for basic validation
                        placeholder="e.g., Projector not working, Room is dirty"
                    />
                </div>
                
                {/* Note: resourceName is a prop for display, not an input to be sent.
                    Your backend doesn't expect a 'name' field for issue creation.
                    If you wanted to send it, you'd add it to formInputData and your backend validation. */}
                
                <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea
                        id="description" // ID matches the key in formInputData
                        value={formInputData.description}
                        onChange={handleInputChange}
                        rows="4"
                        placeholder="Provide more details about the issue..."
                    ></textarea>
                </div>
                
                <div className="form-group">
                    <label htmlFor="issuePhotoInput">Attach Photo (Optional):</label>
                    <input
                        type="file"
                        id="issuePhotoInput"
                        accept="image/*" // Restrict file selection to image types
                        onChange={handlePhotoChange}
                    />
                </div>
                
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Issue reported successfully!</p>}
                
                <div className="form-actions">
                    <button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Report'}
                    </button>
                    <button type="button" onClick={onClose} disabled={loading}>Cancel</button>
                </div>
            </form>
        </div>
    );
}