import { useContext, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/appContext';
import authService from '../services/authService';
import logo from '../assets/logo.png';

export default function EmailVerifyRequiredPage() {
    const { user } = useContext(AppContext);
    const location = useLocation();
    const navigate = useNavigate();
    
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleResendVerification = async () => {
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const data = await authService.resendVerificationEmail(user.email);
            setMessage(data.message || 'Verification email sent! Please check your inbox.');
        } catch (err) {
            setError(err.message || 'Failed to send verification email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                <div className="auth-content">
                    <div>
                        <img src={logo} alt="logo" width={110} height={110} />
                        <h2>Mzuzu University Resource Booking App</h2>
                    </div>
                    
                    <div className="verification-required">
                        <h3>Email Verification Required</h3>
                        
                        <div className="verification-info">
                            <p>Hello <strong>{user?.first_name || 'User'}</strong>,</p>
                            <p>Your email address <strong>{user?.email}</strong> needs to be verified before you can access this page.</p>
                            
                            <div className="verification-steps">
                                <h4>To verify your email:</h4>
                                <ol>
                                    <li>Check your email inbox for a verification link</li>
                                    <li>Click the verification link in the email</li>
                                    <li>Once verified, you'll be able to access all features</li>
                                </ol>
                            </div>
                        </div>

                        {message && <p className="success-message">{message}</p>}
                        {error && <p className="error-message">{error}</p>}

                        <div className="verification-actions">
                            <button 
                                onClick={handleResendVerification} 
                                disabled={isLoading}
                                className="btn btn-primary"
                            >
                                {isLoading ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                            
                            <button onClick={handleGoBack} className="btn btn-secondary">
                                Go Back
                            </button>
                            
                            <button onClick={handleLogout} className="btn btn-outline">
                                Logout
                            </button>
                        </div>

                        <div className="verification-help">
                            <p><strong>Need help?</strong></p>
                            <ul>
                                <li>Check your spam/junk folder</li>
                                <li>Make sure you're using the correct email address</li>
                                <li>Contact support if you continue to have issues</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <footer className="login-footer">
                <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
            </footer>
        </div>
    );
}