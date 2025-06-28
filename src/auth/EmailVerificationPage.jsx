import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AppContext } from '../context/appContext';
import authService from '../services/authService';

export default function EmailVerificationPage() {
    const { id, hash } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser, setToken } = useContext(AppContext);

    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
    const [message, setMessage] = useState('');
    const [loadingResend, setLoadingResend] = useState(false);

    const verifyEmail = useCallback(async () => {
        try {
            // Get query parameters
            const expires = searchParams.get('expires');
            const signature = searchParams.get('signature');
            
            console.log('=== Email Verification Debug ===');
            console.log('URL Parameters:', { id, hash, expires, signature });
            console.log('Full URL:', window.location.href);
            console.log('===============================');
            
            // Construct the verification URL with query parameters
            let verificationUrl = `/email/verify/${id}/${hash}`;
            if (expires && signature) {
                verificationUrl += `?expires=${expires}&signature=${signature}`;
            }
            
            const data = await authService.verifyEmail(id, hash, expires, signature);
            
            setStatus('success');
            setMessage(data.message || 'Your email has been successfully verified!');
            
            // If backend provides a token on verification, set it
            if (data.token) {
                setToken(data.token);
                if (data.user) {
                    setUser(data.user);
                }
            }
        } catch (error) {
            setStatus('failed');
            setMessage(error.message || 'Email verification failed. The link might be invalid or expired.');
            console.error("Email verification error:", error);
        }
    }, [id, hash, searchParams, setToken, setUser]);

    useEffect(() => {
        if (id && hash) {
            verifyEmail();
        } else {
            setStatus('failed');
            setMessage('Invalid verification link. Missing ID or hash.');
        }
    }, [id, hash, verifyEmail]);

    const handleResendVerification = async () => {
        setLoadingResend(true);
        setMessage('');

        try {
            // For resend, we need the user's email
            // This could be stored in localStorage or passed as a parameter
            const storedUser = authService.getStoredUser();
            const email = storedUser?.email;
            
            if (!email) {
                setMessage("Please log in first to resend a verification email.");
                setLoadingResend(false);
                return;
            }

            const data = await authService.resendVerificationEmail(email);
            setMessage(data.message || 'Verification email sent! Please check your inbox.');
        } catch (error) {
            setMessage(error.message || 'Failed to send verification email. Please try again.');
        } finally {
            setLoadingResend(false);
        }
    };

    const handleGoToLogin = () => {
        navigate('/login');
    };

    const handleGoToHome = () => {
        navigate('/');
    };

    return (
        <div className="verification-container">
            <div className="verification-content">
                <h2>Email Verification</h2>
                
                {status === 'verifying' && (
                    <div className="verification-status">
                        <p>Verifying your email address...</p>
                        <div className="loading-spinner"></div>
                    </div>
                )}
                
                {status === 'success' && (
                    <div className="verification-status success">
                        <h3>✅ Verification Successful!</h3>
                        <p>{message}</p>
                        <div className="verification-actions">
                            <button onClick={handleGoToLogin} className="btn btn-primary">
                                Go to Login
                            </button>
                            <button onClick={handleGoToHome} className="btn btn-secondary">
                                Go to Home
                            </button>
                        </div>
                    </div>
                )}
                
                {status === 'failed' && (
                    <div className="verification-status error">
                        <h3>❌ Verification Failed</h3>
                        <p>{message}</p>
                        <div className="verification-actions">
                            <button 
                                onClick={handleResendVerification} 
                                disabled={loadingResend}
                                className="btn btn-primary"
                            >
                                {loadingResend ? 'Sending...' : 'Resend Verification Email'}
                            </button>
                            <Link to="/login" className="btn btn-secondary">
                                Go to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}