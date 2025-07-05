import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/appContext';
import recommendationService from '../services/recommendationService';
import './RecommendationSystem.css';

const RecommendationEngine = () => {
    const { user } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('personalized');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State for different recommendation types
    const [personalizedRecommendations, setPersonalizedRecommendations] = useState([]);
    const [userPreferences, setUserPreferences] = useState(null);
    const [popularResources, setPopularResources] = useState([]);
    const [trendingResources, setTrendingResources] = useState([]);
    const [recentlyBooked, setRecentlyBooked] = useState([]);
    
    // Time-based recommendations
    const [preferredTime, setPreferredTime] = useState('');
    const [timeBasedRecommendations, setTimeBasedRecommendations] = useState([]);
    const [timeLoading, setTimeLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadRecommendations();
        }
    }, [user]);

    const loadRecommendations = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Load all recommendation types in parallel
            const [
                personalizedData,
                preferencesData,
                popularData,
                trendingData,
                recentData
            ] = await Promise.allSettled([
                recommendationService.getPersonalizedRecommendations(8),
                recommendationService.getUserPreferences(),
                recommendationService.getPopularResources(6),
                recommendationService.getTrendingResources(6),
                recommendationService.getRecentlyBookedResources(4)
            ]);

            // Handle personalized recommendations
            if (personalizedData.status === 'fulfilled' && personalizedData.value.success) {
                setPersonalizedRecommendations(personalizedData.value.recommendations || []);
            }

            // Handle user preferences
            if (preferencesData.status === 'fulfilled' && preferencesData.value.success) {
                setUserPreferences(preferencesData.value.preferences);
            }

            // Handle popular resources
            if (popularData.status === 'fulfilled' && popularData.value.success) {
                setPopularResources(popularData.value.resources || []);
            }

            // Handle trending resources
            if (trendingData.status === 'fulfilled' && trendingData.value.success) {
                setTrendingResources(trendingData.value.resources || []);
            }

            // Handle recently booked resources
            if (recentData.status === 'fulfilled' && recentData.value.success) {
                setRecentlyBooked(recentData.value.bookings || []);
            }

        } catch (err) {
            console.error('Error loading recommendations:', err);
            // Don't show error for missing features, just continue with empty data
        } finally {
            setLoading(false);
        }
    };

    const handleTimeBasedSearch = async () => {
        if (!preferredTime) {
            setError('Please select a preferred time.');
            return;
        }

        setTimeLoading(true);
        setError(null);

        try {
            const response = await recommendationService.getTimeBasedRecommendations(preferredTime, 6);
            if (response.success) {
                setTimeBasedRecommendations(response.recommendations || []);
            } else {
                setError(response.message || 'Failed to get time-based recommendations.');
            }
        } catch (err) {
            console.error('Error fetching time-based recommendations:', err);
            setError('Failed to get time-based recommendations. Please try again.');
        } finally {
            setTimeLoading(false);
        }
    };

    const getRecommendationIcon = (category) => {
        const icons = {
            'classrooms': '🏫',
            'ict_labs': '💻',
            'science_labs': '🧪',
            'auditorium': '🎭',
            'sports': '⚽',
            'cars': '🚗'
        };
        return icons[category] || '📋';
    };

    const getScoreColor = (score) => {
        if (score >= 0.8) return 'high-score';
        if (score >= 0.6) return 'medium-score';
        return 'low-score';
    };

    const formatTime = (timeString) => {
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const renderResourceCard = (resource, score = null, reasons = null, showScore = false) => {
        const imageUrl = resource.image_url || resource.image || resource.photo || resource.photo_url || resource.image_path;
        
        return (
            <div key={resource.id} className="recommendation-resource-card">
                <div className="resource-image-container">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={resource.name} 
                            className="resource-card-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                    ) : null}
                    {(!imageUrl || imageUrl === '') && (
                        <div className="resource-image-placeholder">
                            <span className="placeholder-icon">{getRecommendationIcon(resource.category)}</span>
                        </div>
                    )}
                </div>

                <div className="resource-info">
                    <h3 className="resource-title">{resource.name}</h3>
                    <p className="resource-location">
                        <i className="bx bx-been-here"></i> {resource.location}
                    </p>
                    <p className="resource-capacity">
                        <i className="bx bx-group"></i> {resource.capacity} people
                    </p>
                    
                    {showScore && score !== null && (
                        <div className="recommendation-score">
                            <span className={`score-badge ${getScoreColor(score)}`}>
                                {Math.round(score * 100)}% Match
                            </span>
                        </div>
                    )}

                    {reasons && reasons.length > 0 && (
                        <div className="recommendation-reasons">
                            <small className="reasons-label">Why recommended:</small>
                            <ul className="reasons-list">
                                {reasons.slice(0, 2).map((reason, index) => (
                                    <li key={index} className="reason-item">{reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Link to={`/resources/${resource.id}`} className="view-details-button">
                        View Details
                    </Link>
                </div>
            </div>
        );
    };

    const renderUserPreferences = () => {
        if (!userPreferences) return null;

        return (
            <div className="preferences-section">
                <h3>Your Booking Patterns</h3>
                
                {userPreferences.favorite_categories && userPreferences.favorite_categories.length > 0 && (
                    <div className="preference-group">
                        <h4>Favorite Categories</h4>
                        <div className="categories-grid">
                            {userPreferences.favorite_categories.map((cat, index) => (
                                <div key={index} className="category-preference">
                                    <span className="category-icon">{getRecommendationIcon(cat.category)}</span>
                                    <span className="category-name">{cat.category}</span>
                                    <span className="category-percentage">{cat.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {userPreferences.preferred_times && userPreferences.preferred_times.length > 0 && (
                    <div className="preference-group">
                        <h4>Preferred Times</h4>
                        <div className="times-grid">
                            {userPreferences.preferred_times.map((time, index) => (
                                <div key={index} className="time-preference">
                                    <span className="time-value">{time.time}</span>
                                    <span className="time-count">{time.count} bookings</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {userPreferences.average_capacity && (
                    <div className="preference-group">
                        <h4>Capacity Preference</h4>
                        <p>You typically book resources with capacity around <strong>{userPreferences.average_capacity} people</strong></p>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="recommendation-engine">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading personalized recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recommendation-engine">
            <div className="recommendation-header">
                <h1>Resource Recommendations</h1>
                <p>Discover resources tailored to your preferences and booking history</p>
            </div>

            {error && (
                <div className="error-message">
                    <i className="bx bx-error-circle"></i>
                    {error}
                </div>
            )}

            <div className="recommendation-tabs">
                <button 
                    className={`tab-button ${activeTab === 'personalized' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personalized')}
                >
                    <i className="bx bx-star"></i>
                    Personalized
                </button>
                <button 
                    className={`tab-button ${activeTab === 'time-based' ? 'active' : ''}`}
                    onClick={() => setActiveTab('time-based')}
                >
                    <i className="bx bx-time"></i>
                    Time-Based
                </button>
                <button 
                    className={`tab-button ${activeTab === 'popular' ? 'active' : ''}`}
                    onClick={() => setActiveTab('popular')}
                >
                    <i className="bx bx-trending-up"></i>
                    Popular
                </button>
                <button 
                    className={`tab-button ${activeTab === 'trending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('trending')}
                >
                    <i className="bx bx-fire"></i>
                    Trending
                </button>
                <button 
                    className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recent')}
                >
                    <i className="bx bx-history"></i>
                    Recent
                </button>
                <button 
                    className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preferences')}
                >
                    <i className="bx bx-user"></i>
                    My Patterns
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'personalized' && (
                    <div className="recommendation-section">
                        <h2>Personalized for You</h2>
                        <p>Based on your booking history and preferences</p>
                        
                        {personalizedRecommendations.length > 0 ? (
                            <div className="resources-grid">
                                {personalizedRecommendations.map((item) => 
                                    renderResourceCard(item.resource, item.score, item.reasons, true)
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <i className="bx bx-info-circle"></i>
                                <p>No personalized recommendations available yet. Start booking resources to get personalized suggestions!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'time-based' && (
                    <div className="recommendation-section">
                        <h2>Time-Based Recommendations</h2>
                        <p>Find resources available at your preferred time</p>
                        
                        <div className="time-input-section">
                            <input
                                type="datetime-local"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className="time-input"
                                placeholder="Select preferred time"
                            />
                            <button 
                                onClick={handleTimeBasedSearch}
                                disabled={timeLoading || !preferredTime}
                                className="search-button"
                            >
                                {timeLoading ? 'Searching...' : 'Find Available Resources'}
                            </button>
                        </div>

                        {timeBasedRecommendations.length > 0 && (
                            <div className="resources-grid">
                                {timeBasedRecommendations.map((item) => 
                                    renderResourceCard(item.resource, item.score, [item.reason], true)
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'popular' && (
                    <div className="recommendation-section">
                        <h2>Popular Resources</h2>
                        <p>Most frequently booked resources</p>
                        
                        {popularResources.length > 0 ? (
                            <div className="resources-grid">
                                {popularResources.map((resource) => 
                                    renderResourceCard(resource)
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <i className="bx bx-info-circle"></i>
                                <p>No popular resources data available.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'trending' && (
                    <div className="recommendation-section">
                        <h2>Trending Resources</h2>
                        <p>Resources with increasing popularity</p>
                        
                        {trendingResources.length > 0 ? (
                            <div className="resources-grid">
                                {trendingResources.map((resource) => 
                                    renderResourceCard(resource)
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <i className="bx bx-info-circle"></i>
                                <p>No trending resources data available.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'recent' && (
                    <div className="recommendation-section">
                        <h2>Recently Booked</h2>
                        <p>Resources you've booked recently</p>
                        
                        {recentlyBooked.length > 0 ? (
                            <div className="resources-grid">
                                {recentlyBooked.map((booking) => 
                                    renderResourceCard(booking.resource)
                                )}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <i className="bx bx-info-circle"></i>
                                <p>No recent bookings found. Start booking resources to see them here!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="recommendation-section">
                        <h2>Your Booking Patterns</h2>
                        <p>Insights into your resource booking behavior</p>
                        
                        {userPreferences ? (
                            renderUserPreferences()
                        ) : (
                            <div className="empty-state">
                                <i className="bx bx-info-circle"></i>
                                <p>No booking history available to analyze patterns.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendationEngine; 