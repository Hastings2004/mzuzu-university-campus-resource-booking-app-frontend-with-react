import React from 'react';
import { Link } from 'react-router-dom';

export default function EmailVerifyRequiredPage() {
    return (
        <div className="auth-container">
            <h1 className="auth-title">Email Verification Required</h1>
            <div className="info-message">
                <p>Your account is not yet verified. To access the application, please verify your email address.</p>
                <p>A verification link has been sent to your email inbox. If you don't see it, please check your spam folder.</p>
                <p>If you need to resend the verification email, you can do so from the <Link to="/login">login page</Link>.</p>
            </div>
            <div className="auth-footer">
                <p>Having trouble? Contact support.</p>
            </div>
        </div>
    );
}