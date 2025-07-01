import { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import authService from '../services/authService';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [validatingToken, setValidatingToken] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);
    const { token: urlToken } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Read email from query string if present
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const emailFromUrl = params.get('email');
        if (emailFromUrl) {
            setEmail(decodeURIComponent(emailFromUrl));
        }
    }, [location]);

    useEffect(() => {
        if (urlToken) {
            setToken(urlToken);
            validateToken(urlToken);
        }
    }, [urlToken]);

    const validateToken = async (tokenToValidate) => {
        if (!tokenToValidate) return;
        if (!email) {
            setError('Please enter your email to validate the reset token.');
            return;
        }
        setValidatingToken(true);
        setError('');
        try {
            const data = await authService.checkResetToken(email, tokenToValidate);
            if (data.valid) {
                setTokenValid(true);
                if (data.email) {
                    setEmail(data.email);
                }
            } else {
                setTokenValid(false);
                setError('Invalid or expired reset token. Please request a new password reset link.');
            }
        } catch (err) {
            setTokenValid(false);
            setError(err.message || 'Failed to validate reset token. Please try again.');
        } finally {
            setValidatingToken(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }

        // Validate password strength (basic validation)
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const data = await authService.resetPassword({
                email,
                password,
                password_confirmation: passwordConfirmation,
                token,
            });
            
            if (data.success) {
                setSuccess(data.message || 'Password has been reset successfully!');
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(data.message || 'Failed to reset password. Please check your information and try again.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTokenChange = (e) => {
        const newToken = e.target.value;
        setToken(newToken);
        if (newToken.length > 10) { // Basic validation to avoid too many API calls
            validateToken(newToken);
        } else {
            setTokenValid(false);
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
                        {validatingToken && <p className='info-message'>Validating reset token...</p>}
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
                                    readOnly={!!email}
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
                                    disabled={loading}
                                />
                                <span 
                                    className="password-toggle-icon" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <div className='form-details password-field'>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="passwordConfirmation" 
                                    className='input'
                                    placeholder="Confirm New Password"
                                    value={passwordConfirmation}
                                    onChange={e => setPasswordConfirmation(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    disabled={loading}
                                />
                                <span 
                                    className="password-toggle-icon" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {/* If token is not in URL, allow manual entry */}
                            {!urlToken && (
                                <div className='form-details'>
                                    <input 
                                        type="text"
                                        id="token"
                                        className={`input ${tokenValid ? 'input-success' : ''}`}
                                        placeholder="Reset Token"
                                        value={token}
                                        onChange={handleTokenChange}
                                        required
                                        disabled={loading}
                                    />
                                    {tokenValid && <p className='success-message'>✓ Valid token</p>}
                                </div>
                            )}
                            <div className='form-details'>
                                <button 
                                    type="submit" 
                                    disabled={loading || validatingToken || (!tokenValid && !urlToken)}
                                >
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
                                <p>Need a new reset link? 
                                    <span> 
                                        <Link to="/forget-password" className="nav-link">
                                            Request Reset
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