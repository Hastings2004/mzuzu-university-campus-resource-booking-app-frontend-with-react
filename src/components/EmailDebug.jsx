import { useState } from 'react';
import { testEmailConfiguration, checkEmailRoutes } from '../services/emailTest';
import authService from '../services/authService';

export default function EmailDebug() {
    const [testResults, setTestResults] = useState(null);
    const [routeResults, setRouteResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const runEmailTest = async () => {
        setIsLoading(true);
        try {
            const results = await testEmailConfiguration();
            setTestResults(results);
        } catch (error) {
            setTestResults({ success: false, message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const checkRoutes = async () => {
        setIsLoading(true);
        try {
            const results = await checkEmailRoutes();
            setRouteResults(results);
        } catch (error) {
            setRouteResults({ error: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const testResendEmail = async () => {
        setIsLoading(true);
        try {
            const user = authService.getStoredUser();
            if (!user?.email) {
                alert('No user email found. Please log in first.');
                return;
            }
            
            const result = await authService.resendVerificationEmail(user.email);
            alert(`Resend result: ${JSON.stringify(result, null, 2)}`);
        } catch (error) {
            alert(`Resend error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="email-debug" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Email Debug Tools</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={runEmailTest} 
                    disabled={isLoading}
                    style={{ marginRight: '10px', padding: '10px' }}
                >
                    {isLoading ? 'Testing...' : 'Test Email Configuration'}
                </button>
                
                <button 
                    onClick={checkRoutes} 
                    disabled={isLoading}
                    style={{ marginRight: '10px', padding: '10px' }}
                >
                    {isLoading ? 'Checking...' : 'Check Email Routes'}
                </button>
                
                <button 
                    onClick={testResendEmail} 
                    disabled={isLoading}
                    style={{ padding: '10px' }}
                >
                    {isLoading ? 'Sending...' : 'Test Resend Email'}
                </button>
            </div>

            {testResults && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <h3>Email Test Results:</h3>
                    <pre>{JSON.stringify(testResults, null, 2)}</pre>
                </div>
            )}

            {routeResults && (
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
                    <h3>Route Check Results:</h3>
                    <pre>{JSON.stringify(routeResults, null, 2)}</pre>
                </div>
            )}

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <h3>Common Email Issues:</h3>
                <ul>
                    <li><strong>Laravel Mail Configuration:</strong> Check your Laravel .env file for MAIL_* settings</li>
                    <li><strong>Email Driver:</strong> Make sure you're using a proper mail driver (smtp, mailgun, etc.)</li>
                    <li><strong>Email Templates:</strong> Verify that email verification templates exist</li>
                    <li><strong>Routes:</strong> Ensure email verification routes are properly defined</li>
                    <li><strong>User Model:</strong> Check if your User model implements MustVerifyEmail</li>
                    <li><strong>Database:</strong> Verify email_verification_tokens table exists</li>
                </ul>
            </div>
        </div>
    );
} 