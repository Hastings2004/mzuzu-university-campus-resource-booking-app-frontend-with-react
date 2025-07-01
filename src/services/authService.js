import api from './api';

class AuthService {
  // Register new user
  async register(userData) {
    try {
      const response = await api.post('/register', userData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleError(error);
    }
  }

  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/login', credentials);
      console.log('Login response:', response.data);
      
      if (response.data.token) {
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get('/user');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Verify email
  async verifyEmail(id, hash, expires = null, signature = null) {
    try {
      console.log('Verifying email with:', { id, hash, expires, signature });
      
      // Try the original Laravel verification endpoint first
      try {
        const response = await api.get(`/email/verify/${id}/${hash}?expires=${expires}&signature=${signature}`);
        console.log('Email verification response:', response.data);
        return response.data;
      } catch (error) {
        // If signature validation fails, try alternative verification
        console.log('Signature validation failed, trying alternative method...');
        return await this.verifyEmailAlternative(id, hash);
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw this.handleError(error);
    }
  }

  // Alternative verification method (bypasses signature validation)
  async verifyEmailAlternative(id, hash) {
    try {
      const response = await api.post('/email/verify-alternative', {
        id: id,
        hash: hash
      });
      console.log('Alternative email verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Alternative verification error:', error);
      throw this.handleError(error);
    }
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      console.log('Resending verification email to:', email);
      
      // Try different endpoints that might exist
      let response;
      
      try {
        // First try the standard Laravel endpoint
        response = await api.post('/email/verification-notification', { email });
      } catch (error) {
        if (error.response?.status === 404) {
          // Try alternative endpoint
          response = await api.post('/resend-verification-email', { email });
        } else {
          throw error;
        }
      }
      
      console.log('Resend verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw this.handleError(error);
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      console.log('Requesting password reset for:', email);
      const response = await api.post('/forgot-password', { email });
      console.log('Forgot password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw this.handleError(error);
    }
  }

  // Check reset token validity
  async checkResetToken(email, token) {
    try {
      console.log('Checking reset token validity');
      const response = await api.post('/check-reset-token', { email, token });
      console.log('Check reset token response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Check reset token error:', error);
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(data) {
    try {
      console.log('Resetting password');
      const response = await api.post('/reset-password', data);
      console.log('Reset password response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw this.handleError(error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  // Get stored user data
  getStoredUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('token');
  }

  // Update stored user data
  updateStoredUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Handle API errors
  handleError(error) {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data.message || 'An error occurred',
        errors: error.response.data.errors || {},
        status: error.response.status
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error. Please check your connection.',
        errors: {},
        status: 0
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        errors: {},
        status: 0
      };
    }
  }
}

export default new AuthService(); 