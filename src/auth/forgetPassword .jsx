import { useState } from 'react';
import logo from '../assets/logo.png';
import { Link } from 'react-router-dom';

export default function ForgetPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await fetch('/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess(data.message || 'Password reset email sent!');
            } else {
                setError(data.message || 'Failed to send reset email.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                        <h3>Forgot Password</h3>
                        {error && <p className='error general-error'>{error}</p>} {/* General error message */}
                        {success && <p className='success-message'>{success}</p>}
                    </div>
                    <form onSubmit={handleSubmit} id='form'>
                        <div className='form-content'>
                            
                            <div className='form-details'>
                                <input 
                                    type="email"
                                    id="email"
                                    className={`input ${error ? 'input-error' : ''}`}
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                                {error && <p className='error'>{error}</p>}
                            </div>
                            <div className='form-details'>
                                <button type="submit" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                            <div className='account'>
                                <div>
                                    <p>Already have an account? 
                                        <span> 
                                            <Link to="/login" className="nav-link">
                                                Login
                                            </Link>
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                   
                </div>
                
            </div>
            <footer className="login-footer" >
                <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
                </footer>
           
            
        </div>
        </>
    );
}