import { useState } from 'react';
import { validateMzuniEmail, isValidMzuniEmail } from '../utils/validation';

/**
 * Example component demonstrating how to use the Mzuzu University email validation
 * This can be used in other forms or components that need email validation
 */
export default function EmailValidationExample() {
    const [email, setEmail] = useState('');
    const [validation, setValidation] = useState({ isValid: false, message: '' });

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        
        // Use the validation utility
        const result = validateMzuniEmail(value);
        setValidation(result);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Check if email is valid before submission
        if (isValidMzuniEmail(email)) {
            alert('Valid Mzuzu University email!');
        } else {
            alert('Please enter a valid Mzuzu University email address.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px' }}>
            <h3>Email Validation Example</h3>
            <p>This demonstrates how to use the Mzuzu University email validation regex:</p>
            <code>/^[a-zA-Z0-9._-]+@my\.mzuni\.ac\.mw$/</code>
            
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="email">Email Address:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="username@my.mzuni.ac.mw"
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: validation.isValid && email ? '2px solid green' : 
                                   validation.message && !validation.isValid ? '2px solid red' : '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    />
                    {validation.message && (
                        <p style={{ 
                            color: validation.isValid ? 'green' : 'red',
                            fontSize: '12px',
                            marginTop: '5px'
                        }}>
                            {validation.message}
                        </p>
                    )}
                </div>
                
                <button 
                    type="submit"
                    disabled={!validation.isValid}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: validation.isValid ? '#4CAF50' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: validation.isValid ? 'pointer' : 'not-allowed'
                    }}
                >
                    Submit
                </button>
            </form>
            
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                <h4>Valid Examples:</h4>
                <ul>
                    <li>john.doe@my.mzuni.ac.mw</li>
                    <li>student123@my.mzuni.ac.mw</li>
                    <li>user_name@my.mzuni.ac.mw</li>
                    <li>test-user@my.mzuni.ac.mw</li>
                </ul>
                
                <h4>Invalid Examples:</h4>
                <ul>
                    <li>john.doe@gmail.com</li>
                    <li>student@mzuni.ac.mw</li>
                    <li>user@my.mzuni.com</li>
                    <li>test@my.mzuni.ac.mw</li>
                </ul>
            </div>
        </div>
    );
} 