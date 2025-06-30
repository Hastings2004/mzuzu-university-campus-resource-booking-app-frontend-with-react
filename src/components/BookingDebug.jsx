import React, { useState } from 'react';
import api from '../services/api';

export default function BookingDebug() {
    const [testResults, setTestResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [bookingData, setBookingData] = useState({
        resource_id: '',
        user_id: '',
        start_time: '',
        end_time: '',
        purpose: 'Test booking for debugging',
        booking_type: 'other'
    });

    const testBookingEndpoint = async () => {
        setIsLoading(true);
        try {
            // Test 1: Check if the endpoint exists
            const response = await api.get('/bookings');
            setTestResults(prev => ({
                ...prev,
                endpoint_exists: true,
                status: response.status,
                data: response.data
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                endpoint_exists: false,
                error: error.message,
                status: error.response?.status,
                data: error.response?.data
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const testBookingSubmission = async () => {
        setIsLoading(true);
        try {
            const testData = {
                resource_id: parseInt(bookingData.resource_id) || 1,
                user_id: parseInt(bookingData.user_id) || 1,
                start_time: bookingData.start_time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                end_time: bookingData.end_time || new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
                purpose: bookingData.purpose,
                booking_type: bookingData.booking_type
            };

            console.log('Testing booking submission with:', testData);

            const response = await api.post('/bookings', testData);
            
            setTestResults(prev => ({
                ...prev,
                submission_success: true,
                submission_response: response.data,
                submission_status: response.status
            }));
        } catch (error) {
            console.error('Booking submission test failed:', error);
            setTestResults(prev => ({
                ...prev,
                submission_success: false,
                submission_error: error.message,
                submission_status: error.response?.status,
                submission_data: error.response?.data
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const testServerHealth = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/');
            setTestResults(prev => ({
                ...prev,
                server_health: true,
                server_status: response.status
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                server_health: false,
                server_error: error.message
            }));
        } finally {
            setIsLoading(false);
        }
    };

    const testAuthentication = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/user');
            setTestResults(prev => ({
                ...prev,
                auth_status: true,
                user_data: response.data
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                auth_status: false,
                auth_error: error.message,
                auth_status_code: error.response?.status
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Booking Debug Tool</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Resource ID
                            </label>
                            <input
                                type="number"
                                value={bookingData.resource_id}
                                onChange={(e) => setBookingData(prev => ({ ...prev, resource_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User ID
                            </label>
                            <input
                                type="number"
                                value={bookingData.user_id}
                                onChange={(e) => setBookingData(prev => ({ ...prev, user_id: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Time (ISO)
                            </label>
                            <input
                                type="text"
                                value={bookingData.start_time}
                                onChange={(e) => setBookingData(prev => ({ ...prev, start_time: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="2024-01-01T10:00:00.000Z"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Time (ISO)
                            </label>
                            <input
                                type="text"
                                value={bookingData.end_time}
                                onChange={(e) => setBookingData(prev => ({ ...prev, end_time: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="2024-01-01T11:00:00.000Z"
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={testServerHealth}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Test Server Health
                        </button>
                        
                        <button
                            onClick={testAuthentication}
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Test Authentication
                        </button>
                        
                        <button
                            onClick={testBookingEndpoint}
                            disabled={isLoading}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Test Booking Endpoint
                        </button>
                        
                        <button
                            onClick={testBookingSubmission}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Test Booking Submission
                        </button>
                    </div>
                </div>
                
                {testResults && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                            {JSON.stringify(testResults, null, 2)}
                        </pre>
                    </div>
                )}
                
                {isLoading && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2">Testing...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 