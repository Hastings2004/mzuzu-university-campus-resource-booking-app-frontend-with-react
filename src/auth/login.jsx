import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png';

import * as fa from 'react-icons/fa'; 

export default function Login(){
    const {setToken} = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false); 
    const [showPassword, setShowPassword] = useState(false); 

    async function handleLogin(e){
        e.preventDefault();
        setIsLoading(true); // Set loading true when submission starts
        setErrors({}); // Clear previous errors

        try {
            const response = await fetch("/api/login", {
                method: "post",
                headers: {
                    "Content-Type": "application/json" // Specify content type
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if(data.errors){
                setErrors(data.errors);
                
                if (data.message) {
                    setErrors(prev => ({ ...prev, general: data.message }));
                }
            } else {
                localStorage.setItem("token", data.token);
                setToken(data.token);
                navigate("/");
            }
        } catch (error) {
            // Handle network errors or unexpected issues
            setErrors(prev => ({ ...prev, general: "Network error. Please try again." }));
            console.error("Login failed:", error);
        } finally {
            setIsLoading(false); // Always set loading to false when request finishes
        }
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        // Optionally clear error for the specific input as user types
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[e.target.id];
            return newErrors;
        });
    };

    return(
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
                    </div>
                    <form onSubmit={handleLogin} id='form'>
                        <div className='form-content'>
                            <div className='form-details'>
                                <input 
                                    type="email" // Use type="email" for better validation
                                    id='email' 
                                    className={`input ${errors.email ? 'input-error' : ''}`} // Add class for error styling
                                    placeholder='Email'
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    autoComplete="username" // Improve autocomplete
                                />
                                {errors.email && <p className='error'>{errors.email}</p>}
                            </div>
                            <div className='form-details password-field'> {/* Add a class for styling password field */}
                                <input 
                                    type={showPassword ? "text" : "password"} // Toggle type
                                    id='password' 
                                    className={`input ${errors.password ? 'input-error' : ''}`} // Add class for error styling
                                    placeholder='Password'
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    autoComplete="current-password" // Improve autocomplete
                                />
                                <span 
                                    className="password-toggle-icon" 
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <fa.FaEyeSlash /> : <fa.FaEye />}
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
                    {/* Optional: Add social login buttons here */}
                    {/* <div className="social-login">
                        <p>Or login with:</p>
                        <button className="social-button google">Login with Google</button>
                        <button className="social-button facebook">Login with Facebook</button>
                    </div> */}
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