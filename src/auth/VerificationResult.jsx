import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import logo from '../assets/logo.png';

export default function VerificationResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState('loading');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyUserEmail = async () => {
            const id = searchParams.get('id');
            const hash = searchParams.get('hash');
            const expires = searchParams.get('expires');
            const signature = searchParams.get('signature');
            const status = searchParams.get('status');

            // If status is provided as a query parameter, use it directly
            if (status) {
                if (status === 'success') {
                    setVerificationStatus('success');
                    setMessage('Email verified successfully! You can now log in to your account.');
                } else if (status === 'error') {
                    setVerificationStatus('error');
                    setError('Email verification failed. Please try again.');
                } else if (status === 'invalid_signature') {
                    setVerificationStatus('error');
                    setError('The verification link is invalid or has expired. Please request a new verification email.');
                }
                return;
            }

            // Otherwise, proceed with actual verification
            if (!id || !hash) {
                setVerificationStatus('error');
                setError('Invalid verification link. Please check your email for the correct link.');
                return;
            }

            try {
                setVerificationStatus('loading');
                setMessage('Verifying your email address...');

                const response = await authService.verifyEmail(id, hash, expires, signature);
                
                if (response.success) {
                    setVerificationStatus('success');
                    setMessage(response.message || 'Email verified successfully! You can now log in to your account.');
                } else {
                    setVerificationStatus('error');
                    setError(response.message || 'Verification failed. Please try again.');
                }
            } catch (err) {
                setVerificationStatus('error');
                setError(err.message || 'An error occurred during verification. Please try again.');
            }
        };

        verifyUserEmail();
    }, [searchParams]);

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    const handleResendVerification = () => {
        navigate('/email/verify-required');
    };

    const renderContent = () => {
        switch (verificationStatus) {
            case 'loading':
                return (
                    <div className="verification-loading">
                        <div className="loading-spinner">
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                            <div className="spinner-ring"></div>
                        </div>
                        <p className="loading-text">{message}</p>
                    </div>
                );
            
            case 'success':
                return (
                    <div className="verification-success">
                        <div className="success-icon-container">
                            <div className="success-icon">
                                <svg className="checkmark" viewBox="0 0 52 52">
                                    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                                    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                                </svg>
                            </div>
                        </div>
                        <h2 className="success-title">Email Verified!</h2>
                        <p className="success-message">{message}</p>
                        <div className="success-info">
                            <p>Your account is now active and ready to use!</p>
                        </div>
                        <button
                            onClick={handleLoginRedirect}
                            className="success-button"
                        >
                            <span>Continue to Login</span>
                            <svg className="button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                            </svg>
                        </button>
                    </div>
                );
            
            case 'error':
                return (
                    <div className="verification-error">
                        <div className="error-icon-container">
                            <div className="error-icon">
                                <svg className="error-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </div>
                        </div>
                        <h2 className="error-title">Verification Failed</h2>
                        <p className="error-message">{error}</p>
                        <div className="error-actions">
                            <button
                                onClick={handleResendVerification}
                                className="error-button primary"
                            >
                                Resend Verification Email
                            </button>
                            <button
                                onClick={handleLoginRedirect}
                                className="error-button secondary"
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                );
            
            default:
                return null;
        }
    };

    return (
        <div className="verification-container">
            <div className="verification-card">
                <div className="verification-header">
                    <h1 className="verification-title">
                        Email Verification
                    </h1>
                </div>
                {renderContent()}
            </div>
        </div>
    );
}