import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../context/appContext";
import authService from "../services/authService";
import { validateMzuniEmail, validatePassword, validateConfirmPassword } from "../utils/validation";
import logo from '../assets/logo.png';
import '../App.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Register() {
    const { setToken } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: "", 
        last_name: "",   
        email: "",
        user_type: "student",
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [emailValidation, setEmailValidation] = useState({ isValid: false, message: '' });
    const [passwordValidation, setPasswordValidation] = useState({ isValid: false, message: '' });
    const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({ isValid: false, message: '' });

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
        
        // Real-time validation
        if (id === 'email') {
            const validation = validateMzuniEmail(value);
            setEmailValidation(validation);
        } else if (id === 'password') {
            const validation = validatePassword(value);
            setPasswordValidation(validation);
        } else if (id === 'password_confirmation') {
            const validation = validateConfirmPassword(formData.password, value);
            setConfirmPasswordValidation(validation);
        }
    };

    async function handleRegistration(e) {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});
        setSuccessMessage(null);

        // Validate all fields before submission
        const emailValidation = validateMzuniEmail(formData.email);
        const passwordValidation = validatePassword(formData.password);
        const confirmPasswordValidation = validateConfirmPassword(formData.password, formData.password_confirmation);
        
        const validationErrors = {};
        
        if (!emailValidation.isValid) {
            validationErrors.email = emailValidation.message;
        }
        if (!passwordValidation.isValid) {
            validationErrors.password = passwordValidation.message;
        }
        if (!confirmPasswordValidation.isValid) {
            validationErrors.password_confirmation = confirmPasswordValidation.message;
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setIsLoading(false);
            return;
        }

        try {
            const data = await authService.register(formData);
            
            // Registration successful
            setSuccessMessage(data.message || "Registration successful! Please check your email to verify your account.");
            
            // Clear form data after successful registration
            setFormData({
                first_name: "",
                last_name: "",
                email: "",
                user_type: "student",
                password: "",
                password_confirmation: "",
            });
            
            // Clear validation states
            setEmailValidation({ isValid: false, message: '' });
            setPasswordValidation({ isValid: false, message: '' });
            setConfirmPasswordValidation({ isValid: false, message: '' });
        } catch (error) {
            console.error("Registration failed:", error);
            
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
                        <h3>Register</h3>
                        {errors.general && <p className='error general-error'>{errors.general}</p>} {/* General error message */}
                        {successMessage && <p className='success-message'>{successMessage}</p>}
                    </div>
                    <form onSubmit={handleRegistration} id='form'>
                        <div className='form-content'>
                            <div className='form-details'>
                                <input 
                                    type="text"
                                    id="first_name"
                                    className={`input ${errors.first_name ? 'input-error' : ''}`}
                                    placeholder="First Name"
                                    value={formData.first_name}
                                    onChange={handleInputChange}
                                    autoComplete="given-name"
                                    required
                                />
                                {errors.first_name && <p className='error'>{errors.first_name}</p>}
                            </div>
                            <div className='form-details'>
                                <input 
                                    type="text"
                                    id="last_name"
                                    className={`input ${errors.last_name ? 'input-error' : ''}`}
                                    placeholder="Last Name"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    autoComplete="family-name"
                                    required
                                />
                                {errors.last_name && <p className='error'>{errors.last_name}</p>}
                            </div>
                            <div className='form-details'>
                                <input 
                                    type="email"
                                    id="email"
                                    className={`input ${errors.email ? 'input-error' : ''} ${emailValidation.isValid && formData.email ? 'input-success' : ''}`}
                                    placeholder="Email (e.g., username@my.mzuni.ac.mw)"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    autoComplete="email"
                                    required
                                />
                                {errors.email && <p className='error'>{errors.email}</p>}
                                {emailValidation.message && !errors.email && (
                                    <p className={emailValidation.isValid ? 'success-message' : 'error'}>
                                        {emailValidation.message}
                                    </p>
                                )}
                            </div>
                           
                            <div className='form-details password-field'>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="password" 
                                    className={`input ${errors.password ? 'input-error' : ''} ${passwordValidation.isValid && formData.password ? 'input-success' : ''}`}
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
                                {passwordValidation.message && !errors.password && (
                                    <p className={passwordValidation.isValid ? 'success-message' : 'error'}>
                                        {passwordValidation.message}
                                    </p>
                                )}
                            </div>
                            <div className='form-details password-field'>
                                <input 
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="password_confirmation" 
                                    className={`input ${errors.password_confirmation ? 'input-error' : ''} ${confirmPasswordValidation.isValid && formData.password_confirmation ? 'input-success' : ''}`}
                                    placeholder="Confirm Password"
                                    value={formData.password_confirmation}
                                    onChange={handleInputChange}
                                    autoComplete="new-password"
                                    required
                                />
                                <span 
                                    className="password-toggle-icon" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                                {errors.password_confirmation && <p className='error'>{errors.password_confirmation}</p>}
                                {confirmPasswordValidation.message && !errors.password_confirmation && (
                                    <p className={confirmPasswordValidation.isValid ? 'success-message' : 'error'}>
                                        {confirmPasswordValidation.message}
                                    </p>
                                )}
                            </div>
                            <div className='form-details'>
                                <button type="submit" disabled={isLoading}>
                                    {isLoading ? 'Registering...' : 'Register'}
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
            {/* Optional: Add a subtle footer/copyright */}
            <footer className="login-footer">
                <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
            </footer>
        </div>
        </>
    );
}