import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/appContext';
import recommendationService from '../services/recommendationService';
import api from '../services/api';

const ApiDebug = () => {
    const { user, token } = useContext(AppContext);
    const [apiStatus, setApiStatus] = useState('Testing...');
    const [testResults, setTestResults] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        testApiConnection();
    }, []);

    const testApiConnection = async () => {
        const results = [];
        
        // Test 1: Basic API connection
        try {
            console.log('=== API CONNECTION TEST ===');
            const response = await api.get('/resources');
            results.push({
                test: 'Basic API Connection',
                status: '✅ SUCCESS',
                details: `Status: ${response.status}, Data: ${response.data.success ? 'Valid' : 'Invalid'}`
            });
            setApiStatus('Connected');
        } catch (error) {
            results.push({
                test: 'Basic API Connection',
                status: '❌ FAILED',
                details: `Status: ${error.response?.status || 'No Response'}, Error: ${error.message}`
            });
            setApiStatus('Failed');
        }

        // Test 2: Authentication
        try {
            const token = localStorage.getItem('token');
            results.push({
                test: 'Authentication Token',
                status: token ? '✅ PRESENT' : '❌ MISSING',
                details: token ? `Token: ${token.substring(0, 20)}...` : 'No token found'
            });
        } catch (error) {
            results.push({
                test: 'Authentication Token',
                status: '❌ ERROR',
                details: error.message
            });
        }

        // Test 3: User Context
        try {
            results.push({
                test: 'User Context',
                status: user ? '✅ LOADED' : '❌ MISSING',
                details: user ? `User: ${user.name || user.email}` : 'No user in context'
            });
        } catch (error) {
            results.push({
                test: 'User Context',
                status: '❌ ERROR',
                details: error.message
            });
        }

        // Test 4: Recommendation endpoints
        const endpoints = [
            { name: 'Personalized Recommendations', path: '/resources/recommendations' },
            { name: 'User Preferences', path: '/user/preferences' },
            { name: 'Time-based Recommendations', path: '/resources/time-based-recommendations' },
            { name: 'Trending Resources', path: '/resources/trending' },
            { name: 'Recent Bookings', path: '/user/recent-bookings' }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await api.get(endpoint.path);
                results.push({
                    test: endpoint.name,
                    status: '✅ AVAILABLE',
                    details: `Status: ${response.status}`
                });
            } catch (error) {
                results.push({
                    test: endpoint.name,
                    status: '❌ NOT FOUND',
                    details: `Status: ${error.response?.status || 'No Response'}`
                });
            }
        }

        setTestResults(results);
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    if (!isVisible) {
        return (
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: 1000
            }}>
                <button
                    onClick={toggleVisibility}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: apiStatus === 'Connected' ? '#4CAF50' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    API: {apiStatus}
                </button>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            maxHeight: '500px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            zIndex: 1000,
            overflow: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>API Debug Panel</h3>
                <button
                    onClick={toggleVisibility}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    ×
                </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <strong>Status:</strong> <span style={{ color: apiStatus === 'Connected' ? '#4CAF50' : '#f44336' }}>
                    {apiStatus}
                </span>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <button
                    onClick={testApiConnection}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    Re-test Connection
                </button>
            </div>

            <div style={{ fontSize: '12px' }}>
                {testResults.map((result, index) => (
                    <div key={index} style={{ 
                        marginBottom: '8px', 
                        padding: '8px', 
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {result.test}
                        </div>
                        <div style={{ color: result.status.includes('✅') ? '#4CAF50' : '#f44336', marginBottom: '2px' }}>
                            {result.status}
                        </div>
                        <div style={{ color: '#666', fontSize: '11px' }}>
                            {result.details}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '15px', fontSize: '11px', color: '#666' }}>
                <strong>Debug Info:</strong><br />
                • React Dev Server: localhost:5173<br />
                • API Proxy Target: http://127.0.0.1:8000<br />
                • Make sure Laravel backend is running on port 8000
            </div>
        </div>
    );
};

export default ApiDebug; 