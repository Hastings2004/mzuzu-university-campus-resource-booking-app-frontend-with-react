import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/appContext';

export default function EmailVerificationPage() {
    const { id, hash } = useParams(); // Get ID and hash from URL parameters
    const navigate = useNavigate();
    const { setUser, setToken } = useContext(AppContext); // Access context to update user/token

    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
    const [message, setMessage] = useState('');
    const [loadingResend, setLoadingResend] = useState(false);

    const verifyEmail = useCallback(async () => {
        try {
            // Your backend /api/email/verify/{id}/{hash} endpoint
            const response = await fetch(`/api/email/verify/${id}/${hash}`, {
                method: 'GET', // Or POST if your backend expects POST for verification. Laravel's default is GET.
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message || 'Your email has been successfully verified!');
                // If backend provides a token on verification, you can set it here
                // If not, prompt user to log in again.
            } else {
                setStatus('failed');
                setMessage(data.message || 'Email verification failed. The link might be invalid or expired.');
            }
        } catch (err) {
            setStatus('failed');
            setMessage('Network error during verification. Please try again.');
            console.error("Email verification network error:", err);
        }
    }, [id, hash]);

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
            // The user must be authenticated to resend the email via this API route
            // For this to work, the user needs to have been logged in.
            // If the user lands here directly from a *fresh* registration email link without logging in,
            // this `sendVerificationEmail` route in Laravel might not find `Auth::user()`.
            // In that case, you'd need a public endpoint that takes an email address.
            // For now, assuming if they are on this page, they might have a token from a previous login attempt.
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                setMessage("Please log in first to resend a verification email.");
                setLoadingResend(false);
                return;
            }

            const response = await fetch('/api/email/verification-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`, // Requires user to be logged in (even if unverified)
                },
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Verification email sent! Please check your inbox.');
            } else {
                setMessage(data.message || 'Failed to send verification email. Please try again.');
            }
        } catch (err) {
            setMessage('Network error. Failed to send verification email.');
            console.error("Resend verification network error:", err);
        } finally {
            setLoadingResend(false);
        }
    };

    return (
        <div className="auth-container"> {/* Reusing auth-container styles */}
            <h1 className="auth-title">Email Verification</h1>
            {status === 'verifying' && (
                <p className="loading-message">Verifying your email address...</p>
            )}
            {status === 'success' && (
                <div className="success-message">
                    <p>{message}</p>
                    <p>You can now <Link to="/login">log in</Link> to your account.</p>
                </div>
            )}
            {status === 'failed' && (
                <div className="error-message">
                    <p>{message}</p>
                    <p>If you believe this is an error, you can try to resend the verification email.</p>
                    <button onClick={handleResendVerification} disabled={loadingResend} className="action-button primary-button">
                        {loadingResend ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                    <p>Already verified? Go to <Link to="/login">Login</Link>.</p>
                </div>
            )}
        </div>
    );
}