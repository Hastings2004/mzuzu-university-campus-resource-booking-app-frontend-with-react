import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/appContext';
import recommendationService from '../services/recommendationService';
import './RecommendationSystem.css';

const RecommendationWidget = ({ type = 'personalized', limit = 4, showTitle = true }) => {
    const { user } = useContext(AppContext);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {
            loadRecommendations();
        }
    }, [user, type, limit]);

    const loadRecommendations = async () => {
        setLoading(true);
        setError(null);

        try {
            let data;
            switch (type) {
                case 'personalized':
                    data = await recommendationService.getPersonalizedRecommendations(limit);
                    break;
                case 'popular':
                    data = await recommendationService.getPopularResources(limit);
                    break;
                case 'trending':
                    data = await recommendationService.getTrendingResources(limit);
                    break;
                case 'recent':
                    data = await recommendationService.getRecentlyBookedResources(limit);
                    break;
                default:
                    data = await recommendationService.getPersonalizedRecommendations(limit);
            }

            if (data.success) {
                const items = data.recommendations || data.resources || data.bookings || [];
                setRecommendations(items);
            } else {
                // Don't show error for missing features, just show empty state
                setRecommendations([]);
            }
        } catch (err) {
            console.error('Error loading recommendations:', err);
            // Don't show error for missing features, just show empty state
            setRecommendations([]);
        } finally {
            setLoading(false);
        }
    };

    const getWidgetTitle = () => {
        const titles = {
            personalized: 'Recommended for You',
            popular: 'Popular Resources',
            trending: 'Trending Now',
            recent: 'Recently Booked'
        };
        return titles[type] || 'Recommendations';
    };

    const getWidgetIcon = () => {
        const icons = {
            personalized: 'bx-star',
            popular: 'bx-trending-up',
            trending: 'bx-fire',
            recent: 'bx-history'
        };
        return icons[type] || 'bx-star';
    };

    const renderResourceCard = (item) => {
        const resource = item.resource || item;
        const imageUrl = resource.image_url || resource.image || resource.photo || resource.photo_url || resource.image_path;
        
        return (
            <div key={resource.id} className="widget-resource-card">
                <div className="widget-resource-image">
                    {imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={resource.name} 
                            className="widget-image"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                            }}
                        />
                    ) : null}
                    {(!imageUrl || imageUrl === '') && (
                        <div className="widget-image-placeholder">
                            <i className="bx bx-building"></i>
                        </div>
                    )}
                </div>

                <div className="widget-resource-info">
                    <h4 className="widget-resource-title">{resource.name}</h4>
                    <p className="widget-resource-location">
                        <i className="bx bx-been-here"></i> {resource.location}
                    </p>
                    
                    {item.score && (
                        <div className="widget-score">
                            <span className={`widget-score-badge ${item.score >= 0.8 ? 'high' : item.score >= 0.6 ? 'medium' : 'low'}`}>
                                {Math.round(item.score * 100)}% Match
                            </span>
                        </div>
                    )}

                    <Link to={`/resources/${resource.id}`} className="widget-view-button">
                        View Details
                    </Link>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="recommendation-widget">
                {showTitle && (
                    <div className="widget-header">
                        <h3 className="widget-title">
                            <i className={`bx ${getWidgetIcon()}`}></i>
                            {getWidgetTitle()}
                        </h3>
                    </div>
                )}
                <div className="widget-loading">
                    <div className="widget-spinner"></div>
                    <p>Loading recommendations...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recommendation-widget">
                {showTitle && (
                    <div className="widget-header">
                        <h3 className="widget-title">
                            <i className={`bx ${getWidgetIcon()}`}></i>
                            {getWidgetTitle()}
                        </h3>
                    </div>
                )}
                <div className="widget-error">
                    <i className="bx bx-error-circle"></i>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className="recommendation-widget">
                {showTitle && (
                    <div className="widget-header">
                        <h3 className="widget-title">
                            <i className={`bx ${getWidgetIcon()}`}></i>
                            {getWidgetTitle()}
                        </h3>
                    </div>
                )}
                <div className="widget-empty">
                    <i className="bx bx-info-circle"></i>
                    <p>No recommendations available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="recommendation-widget">
            {showTitle && (
                <div className="widget-header">
                    <h3 className="widget-title">
                        <i className={`bx ${getWidgetIcon()}`}></i>
                        {getWidgetTitle()}
                    </h3>
                    <Link to="/recommendations" className="widget-view-all">
                        View All <i className="bx bx-chevron-right"></i>
                    </Link>
                </div>
            )}
            
            <div className="widget-content">
                {recommendations.map(renderResourceCard)}
            </div>
        </div>
    );
};

export default RecommendationWidget; 