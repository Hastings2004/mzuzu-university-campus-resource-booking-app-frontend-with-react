import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../context/appContext";
import authService from "../services/authService";
import logo from '../assets/logo.png';
import '../App.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
    const { setToken } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: null }));
        }
    };

    async function handleRegistration(e) {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setSuccessMessage(null);

        try {
            const data = await authService.login(formData);
            
            // Registration successful
            setSuccessMessage(data.message || "Login successfully.");
            console.log("Login successful, token received:", data.token ? 'Yes' : 'No');
            localStorage.setItem("token", data.token);
            setToken(data.token);
            
            // Check if user is admin and redirect accordingly
            if (data.user && data.user.user_type === 'admin') {
                console.log("Admin user detected, redirecting to statistical dashboard");
                navigate("/statistical");
            } else {
                console.log("Regular user, redirecting to home page");
                navigate("/");
            }
            
            // Clear form data after successful login
            setFormData({
                email: "",
                password: "",
            });
        } catch (error) {
            console.error("Login failed:", error);
            
            if (error.errors) {
                setErrors(error.errors);
            }
            if (error.message) {
                setErrors(prev => ({ ...prev, general: error.message }));
            }
        } finally {
            setIsLoading(false);
        }
    }

    const h2Style = {
        fontSize: '1.5rem',
        color: '#333',
        marginBottom: '1rem',
        textAlign: 'center',
        color: 'green',
        fontWeight: 'bold',
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
                        <h3>Login</h3>
                        {errors.general && <p className='error general-error'>{errors.general}</p>} {/* General error message */}
                        {successMessage && <p className='success-message'>{successMessage}</p>}
                    </div>
                    <form onSubmit={handleRegistration} id='form'>
                        <div className='form-content'>
                            
                            <div className='form-details'>
                                <input 
                                    type="email"
                                    id="email"
                                    className={`input ${errors.email ? 'input-error' : ''}`}
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <p className='error'>{errors.email}</p>}
                            </div>
                            <div className='form-details password-field'>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="password" 
                                    className={`input ${errors.password ? 'input-error' : ''}`}
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    autoComplete="new-password"
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
                            <div className='form-details'>
                                <button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Logging...' : 'Login'}
                                </button>
                            </div>
                            <div className='account'>
                                <div>
                                    <p>Already have an account? 
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
            {/* Optional: Add a subtle footer/copyright */}
            <footer className="login-footer">
                <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
            </footer>
        </div>
        </>
    );
}