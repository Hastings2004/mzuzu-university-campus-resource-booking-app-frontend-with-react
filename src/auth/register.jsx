import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppContext } from "../context/appContext";
import logo from '../assets/logo.png';
import '../App.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { color } from "chart.js/helpers";

export default function Register() {
    const { setToken } = useContext(AppContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: "", // State key
        last_name: "",   // State key
        email: "",
        user_type: "",
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function handleRegistration(e) {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch("/api/register", {
                method: "post",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.errors) {
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
            setErrors(prev => ({ ...prev, general: "Network error. Please try again." }));
            console.error("Registration failed:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleInputChange = (e) => {
        // e.target.id will now correctly match the formData keys: 'first_name', 'last_name', etc.
        setFormData({ ...formData, [e.target.id || e.target.name]: e.target.value });
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[e.target.id || e.target.name];
            return newErrors;
        });
    };

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
                        <p>Join Mzuzu University Resource Booking App Get Started with Easy Booking!</p>
                    </div>

                    <div className='content'>
                        <div>
                            <img src={logo} alt="logo" width={110} height={110} />
                            <h2 style={h2Style}>Resource Booking App</h2>
                        </div>
                        <div>
                            <h3>Register</h3>
                            {errors.general && <p className='error general-error'>{errors.general}</p>}
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
                                    {errors.first_name && <span className="error">{errors.first_name}</span>}
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
                                    {errors.last_name && <span className="error">{errors.last_name}</span>}
                                </div>
                                
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
                                    {errors.email && <span className="error">{errors.email}</span>}
                                </div>

                                {/* Student ID input, show only if user_type is 'student' */}
                                {formData.user_type === 'student' && (
                                    <div className='form-details'>
                                        <input
                                            type="text"
                                            id="student_id"
                                            className={`input ${errors.student_id ? 'input-error' : ''}`}
                                            placeholder="Student ID"
                                            value={formData.student_id}
                                            onChange={handleInputChange}
                                            required={formData.user_type === 'student'}
                                        />
                                        {errors.student_id && <span className="error">{errors.student_id}</span>}
                                    </div>
                                )}
                                {formData.user_type === 'staff' && (
                                    <div className='form-details'>
                                        <input
                                            type="text"
                                            id="student_id"
                                            className={`input ${errors.student_id ? 'input-error' : ''}`}
                                            placeholder="Staff ID"
                                            value={formData.staff_id}
                                            onChange={handleInputChange}
                                            required={formData.user_type === 'student'}
                                        />
                                        {errors.student_id && <span className="error">{errors.student_id}</span>}
                                    </div>
                                )}

                                <div className='form-details'>
                                    <select
                                        name="user_type"
                                        id="user_type"
                                        className={`input ${errors.user_type ? 'input-error' : ''}`}
                                        value={formData.user_type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">-------------------Select user type---------------------</option>
                                        <option value="student">Student</option>
                                        <option value="staff">Staff</option>
                                        <option value="guest">Guest</option>
                                    </select>
                                    {errors.user_type && <span className="error">{errors.user_type}</span>}
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
                                    {errors.password && <span className="error">{errors.password}</span>}
                                </div>

                                <div className='form-details password-field'>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        id="password_confirmation"
                                        className={`input ${errors.password_confirmation ? 'input-error' : ''}`}
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
                                    {errors.password_confirmation && <span className="error">{errors.password_confirmation}</span>}
                                </div>

                                <div className='form-details'>
                                    <button type='submit' disabled={isLoading}>
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
                <footer className="login-footer">
                    <p>&copy; {new Date().getFullYear()} Resource Booking App. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}