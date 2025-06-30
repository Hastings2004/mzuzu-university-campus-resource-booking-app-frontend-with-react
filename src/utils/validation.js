// Email validation regex for Mzuzu University
export const MZUNI_EMAIL_REGEX = /^[a-zA-Z0-9._-]+@my\.mzuni\.ac\.mw$/;

/**
 * Validates if an email address is a valid Mzuzu University email
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidMzuniEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return MZUNI_EMAIL_REGEX.test(email);
};

/**
 * Validates email and returns detailed validation result
 * @param {string} email - The email address to validate
 * @returns {object} - Object with isValid boolean and message string
 */
export const validateMzuniEmail = (email) => {
    if (!email) {
        return { isValid: false, message: '' };
    }
    
    if (!isValidMzuniEmail(email)) {
        return { 
            isValid: false, 
            message: 'Please use a valid Mzuzu University email address (e.g., username@my.mzuni.ac.mw)' 
        };
    }
    
    return { isValid: true, message: 'Valid Mzuzu University email address' };
};

/**
 * Generic email validation (not restricted to Mzuzu University)
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Password validation with common requirements
 * @param {string} password - The password to validate
 * @returns {object} - Object with isValid boolean and message string
 */
export const validatePassword = (password) => {
    if (!password) {
        return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    // Check for at least one number
    if (!/\d/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    return { isValid: true, message: 'Password meets requirements' };
};

/**
 * Confirm password validation
 * @param {string} password - The original password
 * @param {string} confirmPassword - The password confirmation
 * @returns {object} - Object with isValid boolean and message string
 */
export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
        return { isValid: false, message: 'Please confirm your password' };
    }
    
    if (password !== confirmPassword) {
        return { isValid: false, message: 'Passwords do not match' };
    }
    
    return { isValid: true, message: 'Passwords match' };
}; 