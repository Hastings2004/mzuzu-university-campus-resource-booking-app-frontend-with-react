import api from './api';

class RecommendationService {
    /**
     * Get personalized resource recommendations for the current user
     * @param {number} limit - Maximum number of recommendations to return
     * @returns {Promise<Array>} Array of recommended resources with scores and reasons
     */
    async getPersonalizedRecommendations(limit = 10) {
        try {
            console.log('Fetching personalized recommendations...');
            const response = await api.get(`/recommendations`);
            console.log('Personalized recommendations response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching personalized recommendations:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            });
            
            // Check if it's a 404 (endpoint doesn't exist)
            if (error.response?.status === 404) {
                console.warn('Personalized recommendations endpoint not available, using regular resources');
                try {
                    const fallbackResponse = await api.get(`/resources?limit=${limit}`);
                    return fallbackResponse.data;
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    return { 
                        success: false, 
                        message: 'Unable to fetch recommendations',
                        recommendations: []
                    };
                }
            }
            
            throw error;
        }
    }

    /**
     * Get time-based resource recommendations for a specific time
     * @param {string} preferredTime - ISO string of preferred time
     * @param {number} limit - Maximum number of recommendations to return
     * @returns {Promise<Array>} Array of recommended resources for the time
     */
    async getTimeBasedRecommendations(preferredTime, limit = 5) {
        try {
            const response = await api.get('/recommendations/time-based', {
                params: {
                    preferred_time: preferredTime,
                    limit: limit
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching time-based recommendations:', error);
            throw error;
        }
    }

    /**
     * Get user's booking preferences and patterns
     * @returns {Promise<Object>} User preferences data
     */
    async getUserPreferences() {
        try {
            const response = await api.get('/recommendations/user-preferences');
            return response.data;
        } catch (error) {
            console.error('Error fetching user preferences:', error);
            throw error;
        }
    }

    /**
     * Get popular resources based on booking frequency
     * @param {number} limit - Maximum number of resources to return
     * @returns {Promise<Array>} Array of popular resources
     */
    async getPopularResources(limit = 8) {
        try {
            // Try the new endpoint first, fallback to regular resources
            const response = await api.get(`/resources?limit=${limit}&sort=popularity`);
            return response.data;
        } catch (error) {
            console.warn('Popular resources endpoint not available, using regular resources:', error.message);
            // Fallback to regular resources
            try {
                const response = await api.get(`/resources?limit=${limit}`);
                return response.data;
            } catch (fallbackError) {
                console.error('Error fetching resources for popular fallback:', fallbackError);
                return { success: false, message: 'Unable to fetch popular resources' };
            }
        }
    }

    /**
     * Get recently booked resources by the user
     * @param {number} limit - Maximum number of resources to return
     * @returns {Promise<Array>} Array of recently booked resources
     */
    async getRecentlyBookedResources(limit = 5) {
        try {
            const response = await api.get(`/user/recent-bookings?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.warn('Recent bookings endpoint not available:', error.message);
            // Return empty result instead of throwing
            return { 
                success: true, 
                bookings: [],
                message: 'Recent bookings feature not available yet'
            };
        }
    }

    /**
     * Get similar resources based on a given resource
     * @param {number} resourceId - ID of the resource to find similar ones for
     * @param {number} limit - Maximum number of similar resources to return
     * @returns {Promise<Array>} Array of similar resources
     */
    async getSimilarResources(resourceId, limit = 4) {
        try {
            const response = await api.get(`/resources/${resourceId}/similar?limit=${limit}`);
            return response.data;
        } catch (error) {
            console.warn('Similar resources endpoint not available:', error.message);
            // Return empty result instead of throwing
            return { 
                success: true, 
                resources: [],
                message: 'Similar resources feature not available yet'
            };
        }
    }

    /**
     * Get available time slots for a specific resource
     * @param {number} resourceId - ID of the resource
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Array>} Array of available time slots
     */
    async getAvailableTimeSlots(resourceId, date) {
        try {
            const response = await api.get(`/resources/${resourceId}/availability`, {
                params: { date }
            });
            return response.data;
        } catch (error) {
            console.warn('Availability endpoint not available:', error.message);
            // Return empty result instead of throwing
            return { 
                success: true, 
                timeSlots: [],
                message: 'Availability feature not available yet'
            };
        }
    }

    /**
     * Get trending resources (resources with increasing booking trends)
     * @param {number} limit - Maximum number of resources to return
     * @returns {Promise<Array>} Array of trending resources
     */
    async getTrendingResources(limit = 6) {
        try {
            const response = await api.get(`/trending`);
            return response.data;
        } catch (error) {
            console.warn('Trending resources endpoint not available, using regular resources:', error.message);
            // Fallback to regular resources
            try {
                const response = await api.get(`/resources?limit=${limit}`);
                return response.data;
            } catch (fallbackError) {
                console.error('Error fetching resources for trending fallback:', fallbackError);
                return { success: false, message: 'Unable to fetch trending resources' };
            }
        }
    }

    /**
     * Test API connection
     * @returns {Promise<boolean>} True if API is accessible
     */
    async testApiConnection() {
        try {
            console.log('Testing API connection...');
            const response = await api.get('/resources');
            console.log('API connection successful:', response.status);
            return true;
        } catch (error) {
            console.error('API connection failed:', error);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                method: error.config?.method
            });
            return false;
        }
    }
}

export default new RecommendationService(); 