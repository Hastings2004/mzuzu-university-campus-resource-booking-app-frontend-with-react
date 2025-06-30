import api from './api';

export const testEmailConfiguration = async () => {
    try {
        const response = await api.get('/email/test');
        return response.data;
    } catch (error) {
        console.error('Email test failed:', error);
        return {
            success: false,
            message: error.message || 'Email test failed',
            details: error.response?.data || {}
        };
    }
};

export const checkEmailRoutes = async () => {
    const routes = [
        '/email/verification-notification',
        '/email/verify',
        '/register',
        '/login'
    ];

    const results = {};
    
    for (const route of routes) {
        try {
            const response = await api.get(route);
            results[route] = { exists: true, status: response.status };
        } catch (error) {
            results[route] = { 
                exists: false, 
                status: error.response?.status,
                message: error.message 
            };
        }
    }
    
    return results;
}; 