// src/auth/login.jsx
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png';


import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Ensure these are imported

export default function Login() {
    // Add setUser to context destructuring
    const { setUser, setToken } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resendEmailSuccess, setResendEmailSuccess] = useState(null); // For resend success message

    async function handleLogin(e) {
        e.preventDefault();
        setIsLoading(true);
        setErrors({}); // Clear previous errors
        setResendEmailSuccess(null); // Clear resend message

        try {
            const response = await fetch("/api/login", {
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Login successful, now check email verification status
                if (data.user && data.user.email_verified_at) {
                    // Email is verified, proceed to log in fully
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user)); // Store user object
                    setToken(data.token);
                    setUser(data.user); // Update user in context
                    navigate("/"); // Navigate to home/dashboard
                } else {
                    // Email is NOT verified
                    setErrors(prev => ({
                        ...prev,
                        general: data.message || 'Your email address is not verified. Please check your inbox for a verification link.'
                    }));
                    // Optionally, you might still want to set the token and user
                    // to allow resending verification email from a protected route
                    // or to quickly show user info on a "verify email" page.
                    // For now, let's keep the token/user null if email is not verified,
                    // relying on the user to click resend or manually go to verification page.
                    // Or, set a temporary token/user if the backend allows unverified login but restricts access.
                    // Given your backend, it returns 403 if unverified, so no token is set here for unverified users.
                }
            } else {
                // Login failed for reasons other than verification (e.g., invalid credentials)
                if (data.message) {
                    setErrors(prev => ({ ...prev, general: data.message }));
                }
                if (data.errors) {
                    // Specific validation errors from backend
                    setErrors(prev => ({ ...prev, ...data.errors }));
                }
            }
        } catch (error) {
            setErrors(prev => ({ ...prev, general: "Network error. Please try again." }));
            console.error("Login failed:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleResendVerification = async () => {
        setIsLoading(true); // Use a separate loading state if you prefer, or reuse
        setErrors({});
        setResendEmailSuccess(null);

        try {
            // To resend the verification email, the user needs to be authenticated by Laravel Sanctum.
            // This implies the user successfully logged in but was stopped by the `hasVerifiedEmail()` check.
            // The token is NOT set in localStorage in `handleLogin` if unverified, so we can't send it.
            // The Laravel endpoint `sendVerificationEmail` expects `Auth::user()`.
            // So, for this to work, you might need a public endpoint that takes `email`
            // OR you allow login to set a temporary token, then immediately redirect to an email verification prompt page.

            // Given your backend: `sendVerificationEmail` expects `Auth::user()`.
            // This means we *cannot* call it from here if `handleLogin` didn't set a token.
            // A more robust flow:
            // 1. `handleLogin` always returns a token if credentials are correct.
            // 2. If `user.email_verified_at` is null, you redirect to a `/verify-email-prompt` page.
            // 3. On `/verify-email-prompt`, you use the token to fetch user info and trigger resend.

            // For now, assuming the login attempt *does not* set the token if unverified,
            // the user must manually click a link sent to their email, or the resend logic
            // needs to be updated to be public or use a different auth method.
            // This part of the frontend needs the backend to issue a token even if unverified for this specific route.

            // If we assume `Auth::user()` is available on the backend for `sendVerificationEmail` (e.g., if login did set a token briefly before redirecting to a "verify" page),
            // then you'd need the token. But as `Login.jsx` doesn't set token if unverified, this won't work.

            // Let's modify this to *only* show the resend button if the login error specifically points to unverified email
            // AND we prompt the user to manually try logging in again if they need to resend, or direct them to a simpler resend flow.
            // A common way for resend when not logged in: a specific public endpoint like `/api/resend-verification` that takes only email.
            // If your backend doesn't have such a public route, this button won't work without a token.

            // For now, let's stick to the flow where `handleLogin` *doesn't* set a token if unverified,
            // meaning the user would get the email and click the link directly.
            // If they are on this page and email unverified, we need the backend to support a public resend endpoint.

            // Let's implement a *hypothetical* public resend endpoint here for demonstration.
            // You would need to add this to your Laravel `routes/api.php` and `AuthController`.
            // Example: Route::post('/resend-verification-email', [AuthController::class, 'resendVerificationPublic']);
            const resendResponse = await fetch('/api/resend-verification-email', { // Hypothetical public endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const resendData = await resendResponse.json();

            if (resendResponse.ok) {
                setResendEmailSuccess(resendData.message || 'Verification email sent! Please check your inbox.');
            } else {
                setErrors(prev => ({
                    ...prev,
                    general: resendData.message || 'Failed to resend verification email.'
                }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, general: "Network error. Failed to resend verification email." }));
            console.error("Resend verification network error:", err);
        } finally {
            setIsLoading(false);
        }
    };


    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[e.target.id];
            delete newErrors.general; // Clear general error when user types
            return newErrors;
        });
        setResendEmailSuccess(null); // Clear resend message on input change
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
                            <img src={logo} alt="logo" width={110} height={110} />
                            <h2>Resource Booking App</h2>
                        </div>
                        <div>
                            <h3>Login</h3>
                            {errors.general && <p className='error general-error'>{errors.general}</p>}
                            {resendEmailSuccess && <p className='success-message'>{resendEmailSuccess}</p>} {/* Display resend success */}
                        </div>
                        <form onSubmit={handleLogin} id='form'>
                            <div className='form-content'>
                                <div className='form-details'>
                                    <input
                                        type="email"
                                        id='email'
                                        className={`input ${errors.email ? 'input-error' : ''}`}
                                        placeholder='Email'
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        autoComplete="username"
                                        required
                                    />
                                    {errors.email && <p className='error'>{errors.email}</p>}
                                </div>
                                <div className='form-details password-field'>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id='password'
                                        className={`input ${errors.password ? 'input-error' : ''}`}
                                        placeholder='Password'
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <span
                                        className="password-toggle-icon"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </span>
                                    {errors.password && <p className='error'>{errors.password}</p>}
                                </div>
                                <div>
                                    <p className='remember-me-forgot-password'>
                                        <label>
                                            <input type="checkbox" className="checkbox-input" /> Remember me
                                        </label>
                                        <Link to="/forgot-password" className='link forgot-password-link'>Forget Password?</Link>
                                    </p>
                                </div>
                                <div className='form-details'>
                                    <button type="submit" disabled={isLoading}>
                                        {isLoading ? 'Logging in...' : 'Login'}
                                    </button>
                                </div>
                                {/* Resend Verification Button - Only show if the error is due to unverified email */}
                                {errors.general && errors.general.includes('not verified') && (
                                    <div className="form-details verification-prompt">
                                        <p>Didn't receive the verification email?</p>
                                        <button type="button" onClick={handleResendVerification} disabled={isLoading} className="action-button primary-button">
                                            {isLoading ? 'Sending...' : 'Resend Verification Email'}
                                        </button>
                                    </div>
                                )}
                                <div className='account'>
                                    <div>
                                        <p>Don't have an account?
                                            <span>
                                                <Link to="/register" className="nav-link">
                                                    Register
                                                </Link>
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
                <footer className="login-footer">
                    <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}