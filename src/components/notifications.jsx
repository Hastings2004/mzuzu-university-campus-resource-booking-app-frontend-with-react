import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/appContext'; // Adjust path as needed


export default function Notifications() {
    const { user, token } = useContext(AppContext);

    const [preferences, setPreferences] = useState({
        email_new_messages: false,
        email_system_updates: false,
        in_app_mentions: false,
        in_app_likes: false,
        push_reminders: false, // Example for future push notifications
        // Add more preferences as needed
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch user's notification preferences on component mount
    useEffect(() => {
        const fetchPreferences = async () => {
            if (!user || !token) {
                setLoading(false);
                setError("Please log in to manage notifications.");
                return;
            }

            try {
                const response = await fetch('/api/user/notification-preferences', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.preferences) {
                    setPreferences(prev => ({ ...prev, ...data.preferences }));
                    setLoading(false);
                } else {
                    setError(data.message || "Failed to load notification preferences.");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Fetch preferences error:", err);
                setError("An error occurred while fetching preferences. Please check your network.");
                setLoading(false);
            }
        };

        fetchPreferences();
    }, [user, token]); // Refetch if user or token changes

    // Handle change of a preference (toggle)
    const handlePreferenceChange = async (preferenceName) => {
        const updatedPreferences = {
            ...preferences,
            [preferenceName]: !preferences[preferenceName],
        };

        setPreferences(updatedPreferences); // Optimistic update
        setIsSaving(true);
        setMessage(null);
        setError(null);

        if (!token) {
            setError("Authentication required. Please log in.");
            setIsSaving(false);
            // Revert optimistic update if auth fails
            setPreferences(prev => ({ ...prev, [preferenceName]: !prev[preferenceName] }));
            return;
        }

        try {
            const response = await fetch('/api/user/notification-preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ preferences: updatedPreferences })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "Preferences updated successfully!");
                // If backend returns updated preferences, set them here
                // setPreferences(data.preferences);
            } else {
                setError(data.message || "Failed to save preferences.");
                // Revert optimistic update on backend error
                setPreferences(prev => ({ ...prev, [preferenceName]: !prev[preferenceName] }));
            }
        } catch (err) {
            console.error("Save preferences error:", err);
            setError("An error occurred while saving preferences. Please try again.");
            // Revert optimistic update on network error
            setPreferences(prev => ({ ...prev, [preferenceName]: !prev[preferenceName] }));
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="notifications-container">
                <p className="loading-message">Please log in to manage notifications.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="notifications-container">
                <p className="loading-message">Loading notification preferences...</p>
            </div>
        );
    }

    return (
        <div className="notifications-container">
            <h1>Notification Settings</h1>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            {isSaving && <p className="info-message">Saving changes...</p>}

            {/* Email Notifications Card */}
            <section className="notification-section">
                <h2>Email Notifications</h2>
                <div className="preference-item">
                    <span>New Messages:</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={preferences.email_new_messages}
                            onChange={() => handlePreferenceChange('email_new_messages')}
                            disabled={isSaving}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div className="preference-item">
                    <span>System Updates & Announcements:</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={preferences.email_system_updates}
                            onChange={() => handlePreferenceChange('email_system_updates')}
                            disabled={isSaving}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                {/* Add more email preferences here */}
            </section>

            {/* In-App Notifications Card */}
            <section className="notification-section">
                <h2>In-App Notifications</h2>
                <div className="preference-item">
                    <span>Mentions & Replies:</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={preferences.in_app_mentions}
                            onChange={() => handlePreferenceChange('in_app_mentions')}
                            disabled={isSaving}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div className="preference-item">
                    <span>Likes & Reactions:</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={preferences.in_app_likes}
                            onChange={() => handlePreferenceChange('in_app_likes')}
                            disabled={isSaving}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
                {/* Add more in-app preferences here */}
            </section>

            {/* Push Notifications Card (Example - can be expanded) */}
            <section className="notification-section">
                <h2>Push Notifications</h2>
                <div className="preference-item">
                    <span>Reminders:</span>
                    <label className="switch">
                        <input
                            type="checkbox"
                            checked={preferences.push_reminders}
                            onChange={() => handlePreferenceChange('push_reminders')}
                            disabled={isSaving}
                        />
                        <span className="slider round"></span>
                    </label>
                </div>
            </section>
        </div>
    );
}