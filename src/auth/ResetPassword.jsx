import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import { Link, useParams } from 'react-router-dom';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { token: urlToken } = useParams();

    useEffect(() => {
        if (urlToken) {
            setToken(urlToken);
        }
    }, [urlToken]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    password_confirmation: passwordConfirmation,
                    token,
                }),
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setSuccess(data.message || 'Password has been reset successfully!');
            } else {
                setError(data.message || 'Failed to reset password.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className='head'>
                <div className='slogan-banner'>
                    <p>Welcome to Mzuzu University Resource Booking App – Your Gateway to Effortless Booking!</p>
                </div>
                <div className='auth-content'>
                    <div>
                        <img src={logo} alt="logo" width={110} height={110}/>
                        <h2>Resource Booking App</h2>
                    </div>
                    <div>
                        <h3>Reset Password</h3>
                        {error && <p className='error general-error'>{error}</p>}
                        {success && <p className='success-message'>{success}</p>}
                    </div>
                    <form onSubmit={handleResetPassword} id='form'>
                        <div className='form-content'>
                            <div className='form-details'>
                                <input 
                                    type="email"
                                    id="email"
                                    className='input'
                                    placeholder="Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className='form-details password-field'>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="password" 
                                    className='input'
                                    placeholder="New Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                                <span 
                                    className="password-toggle-icon" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ cursor: 'pointer', marginLeft: 8 }}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </span>
                            </div>
                            <div className='form-details'>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="passwordConfirmation" 
                                    className='input'
                                    placeholder="Confirm New Password"
                                    value={passwordConfirmation}
                                    onChange={e => setPasswordConfirmation(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            {/* If token is not in URL, allow manual entry */}
                            {!urlToken && (
                                <div className='form-details'>
                                    <input 
                                        type="text"
                                        id="token"
                                        className='input'
                                        placeholder="Reset Token"
                                        value={token}
                                        onChange={e => setToken(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                            <div className='form-details'>
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                            <div className='account'>
                                <p>Remembered your password? 
                                    <span> 
                                        <Link to="/login" className="nav-link">
                                            Login
                                        </Link>
                                    </span>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            <footer className="login-footer" >
                <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
            </footer>
        </div>
    );
} 