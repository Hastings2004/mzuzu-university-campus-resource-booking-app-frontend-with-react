import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/appContext';
import recommendationService from '../services/recommendationService';
import './RecommendationSystem.css';

const SmartSearch = ({ placeholder = "Search resources...", showSuggestions = true }) => {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [popularSearches, setPopularSearches] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        loadSearchData();
        
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (query.length >= 2) {
            generateSuggestions();
        } else {
            setSuggestions([]);
        }
    }, [query]);

    const loadSearchData = async () => {
        try {
            // Load recent searches from localStorage
            const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            setRecentSearches(recent.slice(0, 5));

            // Load popular searches (this could come from your backend)
            const popular = [
                'classroom',
                'computer lab',
                'auditorium',
                'sports facility',
                'meeting room'
            ];
            setPopularSearches(popular);
        } catch (error) {
            console.error('Error loading search data:', error);
        }
    };

    const generateSuggestions = async () => {
        setLoading(true);
        
        try {
            // Generate intelligent suggestions based on query
            const intelligentSuggestions = [
                {
                    type: 'category',
                    text: `${query} rooms`,
                    icon: 'bx-building'
                },
                {
                    type: 'location',
                    text: `${query} building`,
                    icon: 'bx-been-here'
                },
                {
                    type: 'capacity',
                    text: `${query} capacity`,
                    icon: 'bx-group'
                }
            ];

            // Add category-specific suggestions
            if (query.toLowerCase().includes('class')) {
                intelligentSuggestions.push({
                    type: 'category',
                    text: 'Classrooms',
                    icon: 'bx-building'
                });
            }

            if (query.toLowerCase().includes('lab') || query.toLowerCase().includes('computer')) {
                intelligentSuggestions.push({
                    type: 'category',
                    text: 'ICT Labs',
                    icon: 'bx-desktop'
                });
            }

            if (query.toLowerCase().includes('sport')) {
                intelligentSuggestions.push({
                    type: 'category',
                    text: 'Sports Facilities',
                    icon: 'bx-football'
                });
            }

            setSuggestions(intelligentSuggestions);
        } catch (error) {
            console.error('Error generating suggestions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (searchQuery) => {
        if (!searchQuery.trim()) return;

        // Save to recent searches
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        const updatedRecent = [searchQuery, ...recent.filter(item => item !== searchQuery)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));

        // Navigate to search results
        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
        setShowDropdown(false);
        setQuery('');
    };

    const handleSuggestionClick = (suggestion) => {
        handleSearch(suggestion.text);
    };

    const handleRecentSearchClick = (searchTerm) => {
        handleSearch(searchTerm);
    };

    const handlePopularSearchClick = (searchTerm) => {
        handleSearch(searchTerm);
    };

    const clearRecentSearches = () => {
        localStorage.removeItem('recentSearches');
        setRecentSearches([]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(query);
        }
    };

    const getSuggestionIcon = (type) => {
        const icons = {
            category: 'bx-building',
            location: 'bx-been-here',
            capacity: 'bx-group',
            default: 'bx-search'
        };
        return icons[type] || icons.default;
    };

    return (
        <div className="smart-search-container" ref={searchRef}>
            <div className="search-input-wrapper">
                <i className="bx bx-search search-icon"></i>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onKeyPress={handleKeyPress}
                    placeholder={placeholder}
                    className="search-input"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="clear-button"
                        type="button"
                    >
                        <i className="bx bx-x"></i>
                    </button>
                )}
            </div>

            {showDropdown && showSuggestions && (
                <div className="search-dropdown">
                    {loading && (
                        <div className="dropdown-loading">
                            <div className="loading-spinner"></div>
                            <span>Generating suggestions...</span>
                        </div>
                    )}

                    {!loading && query.length >= 2 && suggestions.length > 0 && (
                        <div className="dropdown-section">
                            <h4 className="section-title">
                                <i className="bx bx-bulb"></i>
                                Smart Suggestions
                            </h4>
                            <div className="suggestions-list">
                                {suggestions.map((suggestion, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="suggestion-item"
                                    >
                                        <i className={`bx ${suggestion.icon}`}></i>
                                        <span>{suggestion.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && recentSearches.length > 0 && (
                        <div className="dropdown-section">
                            <div className="section-header">
                                <h4 className="section-title">
                                    <i className="bx bx-history"></i>
                                    Recent Searches
                                </h4>
                                <button
                                    onClick={clearRecentSearches}
                                    className="clear-recent-btn"
                                    type="button"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="recent-searches-list">
                                {recentSearches.map((searchTerm, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRecentSearchClick(searchTerm)}
                                        className="recent-search-item"
                                    >
                                        <i className="bx bx-time"></i>
                                        <span>{searchTerm}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && popularSearches.length > 0 && (
                        <div className="dropdown-section">
                            <h4 className="section-title">
                                <i className="bx bx-trending-up"></i>
                                Popular Searches
                            </h4>
                            <div className="popular-searches-list">
                                {popularSearches.map((searchTerm, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handlePopularSearchClick(searchTerm)}
                                        className="popular-search-item"
                                    >
                                        <i className="bx bx-search"></i>
                                        <span>{searchTerm}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && query.length >= 2 && suggestions.length === 0 && (
                        <div className="dropdown-empty">
                            <i className="bx bx-search"></i>
                            <p>No suggestions found for "{query}"</p>
                            <button
                                onClick={() => handleSearch(query)}
                                className="search-anyway-btn"
                            >
                                Search anyway
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SmartSearch; 