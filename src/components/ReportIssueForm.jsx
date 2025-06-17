
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/appContext'; 
//import axios from 'axios'; // Or use native fetch

export default function ReportIssueForm({ resourceId, resourceName, onClose, onIssueReported }) {
    const { token } = useContext(AppContext);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData();
        formData.append('resource_id', resourceId);
        formData.append('subject', subject);
        if (description) formData.append('description', description);
        if (photo) formData.append('photo', photo);

        try {
            const response = await axios.post('/api/resource-issues', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data', // Important for file uploads
                },
            });
            setSuccess(true);
            onIssueReported(response.data.issue); // Pass new issue data back to parent
            // Optionally clear form or close modal
            setSubject('');
            setDescription('');
            setPhoto(null);
            document.getElementById('issuePhotoInput').value = ''; // Clear file input
            setTimeout(onClose, 2000); // Close after 2 seconds
        } catch (err) {
            console.error('Error reporting issue:', err);
            setError(err.response?.data?.message || 'Failed to report issue. Please try again.');
        } finally {
            setLoading(false);
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
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        placeholder="e.g., Projector not working, Room is dirty"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="4"
                        placeholder="Provide more details about the issue..."
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="issuePhotoInput">Attach Photo (Optional):</label>
                    <input
                        type="file"
                        id="issuePhotoInput"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files[0])}
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