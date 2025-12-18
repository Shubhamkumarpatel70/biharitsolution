import React, { useState, useContext, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../axios';
import { UserContext } from '../UserContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(UserContext);
  const submitTimeoutRef = useRef(null);

  // Debounced form validation
  const validateForm = useCallback(() => {
    return email.trim() && password.trim() && email.includes('@');
  }, [email, password]);

  // Optimized submit handler with debouncing
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || loading) return;
    
    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    // Basic validation
    if (!validateForm()) {
      setMessage('Please enter valid email and password.');
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    setMessage('');
    
    // Clear any previous error messages
    setMessage('');
    
    try {
      // Remove unnecessary delay and make login faster
      const res = await axios.post('/api/auth/login', { email: email.trim(), password });
      
      // Store token immediately for faster subsequent requests
      localStorage.setItem('token', res.data.token);
      
      // Store user data in localStorage for role checking
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
      
      // Update user context
      setUser(res.data.user);
      
      // Navigate based on role
      if (res.data.user && (res.data.user.role === 'admin' || res.data.user.role === 'coadmin')) {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      setLoading(false);
      setIsSubmitting(false);
      
      // Better error handling with more specific messages
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setMessage('Login timeout. Please check your connection and try again.');
      } else if (err.response?.status === 400) {
        setMessage(err.response.data.message || 'Invalid credentials.');
      } else if (err.response?.status === 401) {
        setMessage('Authentication failed. Please check your credentials.');
      } else if (err.response?.status === 429) {
        setMessage('Too many login attempts. Please wait a moment and try again.');
      } else if (err.response?.status >= 500) {
        setMessage('Server error. Please try again later.');
      } else if (err.message === 'Network Error') {
        setMessage('Network error. Please check your internet connection.');
      } else {
        setMessage('Login failed. Please try again.');
      }
    }
  }, [email, password, isSubmitting, loading, validateForm, setUser, navigate]);

  // Reset loading state on successful login
  React.useEffect(() => {
    if (!isSubmitting && !loading) {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [isSubmitting, loading]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  // Handle ESC key to close forgot password modal
  React.useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showForgotPassword) {
        setShowForgotPassword(false);
        setForgotEmail('');
        setUserInfo(null);
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
      }
    };

    if (showForgotPassword) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showForgotPassword]);

  // Forgot Password - Verify Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setForgotPasswordLoading(true);
    setMessage('');

    try {
      const res = await axios.post('/api/auth/forgot-password/verify-email', { email: forgotEmail.trim() });
      setUserInfo(res.data.user);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not verify email. Please try again.');
      setUserInfo(null);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Forgot Password - Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setMessage('Please enter both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match. Please try again.');
      return;
    }

    setForgotPasswordLoading(true);
    setMessage('');

    try {
      await axios.post('/api/auth/forgot-password/reset', {
        email: forgotEmail.trim(),
        newPassword: newPassword
      });
      
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setUserInfo(null);
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
        navigate('/login', { state: { success: 'Password reset successfully! Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not reset password. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !isSubmitting && !loading) {
      handleSubmit(e);
    }
  }, [handleSubmit, isSubmitting, loading]);

  return (
    <div style={{ 
      background: '#181A20', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <form 
        onSubmit={handleSubmit} 
        style={{
          background: '#23272F',
          color: '#E5E7EB',
          padding: '2rem 1.5rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          border: '2px solid #0057D9',
        }}
      >
        <h2 style={{ 
          color: '#2ECC71', 
          fontWeight: 700, 
          marginBottom: '0.25rem', 
          textAlign: 'center', 
          fontSize: '1.75rem' 
        }}>
          Login
        </h2>
        
        {location.state?.success && (
          <div style={{ 
            color: '#2ECC71', 
            textAlign: 'center', 
            marginBottom: '0.5rem', 
            fontWeight: 600,
            fontSize: '0.95rem'
          }}>
            {location.state.success}
          </div>
        )}
        
        <div style={{ position: 'relative' }}>
          <label 
            htmlFor="email" 
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A0AEC0',
              fontSize: '1.2rem',
              pointerEvents: 'none',
              zIndex: 2
            }}
            aria-hidden="true"
          >
            📧
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            disabled={loading}
            style={{
              padding: '0.8rem 0.8rem 0.8rem 2.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #3A3F47',
              fontSize: '1rem',
              background: loading ? '#2A2E36' : '#1E222A',
              color: '#E5E7EB',
              width: '100%',
              transition: 'border-color 0.2s, background 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onFocus={e => !loading && (e.target.style.borderColor = '#0057D9')}
            onBlur={e => !loading && (e.target.style.borderColor = '#3A3F47')}
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <label 
            htmlFor="password" 
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#A0AEC0',
              fontSize: '1.2rem',
              pointerEvents: 'none',
              zIndex: 2
            }}
            aria-hidden="true"
          >
            🔒
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            disabled={loading}
            style={{
              padding: '0.8rem 0.8rem 0.8rem 2.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #3A3F47',
              fontSize: '1rem',
              background: loading ? '#2A2E36' : '#1E222A',
              color: '#E5E7EB',
              width: '100%',
              transition: 'border-color 0.2s, background 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onFocus={e => !loading && (e.target.style.borderColor = '#0057D9')}
            onBlur={e => !loading && (e.target.style.borderColor = '#3A3F47')}
          />
          <button
            type="button"
            onClick={() => !loading && setShowPassword(s => !s)}
            disabled={loading}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'transparent',
              border: 'none',
              color: '#A0AEC0',
              fontSize: '1.1rem',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.5 : 1,
            }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || isSubmitting || !validateForm()}
          style={{
            background: (loading || isSubmitting || !validateForm()) ? '#3A3F47' : '#0057D9',
            color: '#E5E7EB',
            padding: '0.9rem',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: (loading || isSubmitting || !validateForm()) ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem',
            borderBottom: '3px solid #2ECC71',
            transition: 'background 0.2s, transform 0.1s',
            opacity: (loading || isSubmitting || !validateForm()) ? 0.7 : 1,
          }}
          onMouseDown={e => !loading && !isSubmitting && validateForm() && (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={e => !loading && !isSubmitting && validateForm() && (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => !loading && !isSubmitting && validateForm() && (e.currentTarget.style.transform = 'scale(1)')}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span className="spinner" style={{
                display: 'inline-block',
                width: '1rem',
                height: '1rem',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                borderTopColor: '#fff',
                animation: 'spin 1s ease-in-out infinite'
              }} />
              Logging in...
            </span>
          ) : 'Login'}
        </button>
        
        {message && (
          <div style={{ 
            color: '#FF6B35', 
            textAlign: 'center', 
            marginTop: '0.5rem',
            fontSize: '0.9rem',
            padding: '0.5rem',
            background: 'rgba(255,107,53,0.1)',
            borderRadius: '0.25rem'
          }}>
            {message}
          </div>
        )}
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.5rem',
          fontSize: '0.9rem'
        }}>
          <span style={{ color: '#A0AEC0' }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{
                color: '#2ECC71',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Sign up
            </Link>
          </span>
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(true);
              setMessage('');
              setUserInfo(null);
              setForgotEmail('');
              setNewPassword('');
              setConfirmPassword('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#2ECC71',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Forgot Password?
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
            backdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotPassword(false);
              setForgotEmail('');
              setUserInfo(null);
              setNewPassword('');
              setConfirmPassword('');
              setMessage('');
            }
          }}
        >
          <form 
            onSubmit={userInfo ? handleResetPassword : handleVerifyEmail}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#23272F',
              color: '#E5E7EB',
              padding: '2rem 1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              border: '2px solid #0057D9',
              position: 'relative',
              animation: 'slideUp 0.3s ease-out'
            }}
          >
          <button
            type="button"
            onClick={() => {
              setShowForgotPassword(false);
              setForgotEmail('');
              setUserInfo(null);
              setNewPassword('');
              setConfirmPassword('');
              setMessage('');
            }}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A0AEC0',
              fontSize: '1.25rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 53, 0.2)';
              e.currentTarget.style.borderColor = '#FF6B35';
              e.currentTarget.style.color = '#FF6B35';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = '#A0AEC0';
            }}
            aria-label="Close"
          >
            ✕
          </button>

          <h2 style={{ 
            color: '#2ECC71', 
            fontWeight: 700, 
            marginBottom: '0.25rem', 
            textAlign: 'center', 
            fontSize: '1.75rem' 
          }}>
            {userInfo ? 'Reset Password' : 'Forgot Password'}
          </h2>

          {!userInfo ? (
            <>
              <p style={{ color: '#A0AEC0', textAlign: 'center', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                Enter your email address to reset your password
              </p>
              
              <div style={{ position: 'relative' }}>
                <label 
                  htmlFor="forgot-email" 
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#A0AEC0',
                    fontSize: '1.2rem',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                  aria-hidden="true"
                >
                  📧
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  disabled={forgotPasswordLoading}
                  style={{
                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #3A3F47',
                    fontSize: '1rem',
                    background: forgotPasswordLoading ? '#2A2E36' : '#1E222A',
                    color: '#E5E7EB',
                    width: '100%',
                    transition: 'border-color 0.2s, background 0.2s',
                    opacity: forgotPasswordLoading ? 0.7 : 1,
                  }}
                  onFocus={e => !forgotPasswordLoading && (e.target.style.borderColor = '#0057D9')}
                  onBlur={e => !forgotPasswordLoading && (e.target.style.borderColor = '#3A3F47')}
                />
              </div>

              <button 
                type="submit" 
                disabled={forgotPasswordLoading || !forgotEmail.trim()}
                style={{
                  background: (forgotPasswordLoading || !forgotEmail.trim()) ? '#3A3F47' : '#0057D9',
                  color: '#E5E7EB',
                  padding: '0.9rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: (forgotPasswordLoading || !forgotEmail.trim()) ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem',
                  borderBottom: '3px solid #2ECC71',
                  transition: 'background 0.2s, transform 0.1s',
                  opacity: (forgotPasswordLoading || !forgotEmail.trim()) ? 0.7 : 1,
                }}
              >
                {forgotPasswordLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </>
          ) : (
            <>
              <div style={{
                background: '#1E222A',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #3A3F47',
                marginBottom: '0.5rem'
              }}>
                <p style={{ color: '#A0AEC0', fontSize: '0.85rem', marginBottom: '0.5rem' }}>User Information:</p>
                <p style={{ color: '#E5E7EB', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Name: <span style={{ color: '#2ECC71' }}>{userInfo.name}</span>
                </p>
                <p style={{ color: '#E5E7EB', fontWeight: 600 }}>
                  Email: <span style={{ color: '#2ECC71' }}>{userInfo.email}</span>
                </p>
              </div>

              <div style={{ position: 'relative' }}>
                <label 
                  htmlFor="new-password" 
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#A0AEC0',
                    fontSize: '1.2rem',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                  aria-hidden="true"
                >
                  🔒
                </label>
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  disabled={forgotPasswordLoading}
                  style={{
                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #3A3F47',
                    fontSize: '1rem',
                    background: forgotPasswordLoading ? '#2A2E36' : '#1E222A',
                    color: '#E5E7EB',
                    width: '100%',
                    transition: 'border-color 0.2s, background 0.2s',
                    opacity: forgotPasswordLoading ? 0.7 : 1,
                  }}
                  onFocus={e => !forgotPasswordLoading && (e.target.style.borderColor = '#0057D9')}
                  onBlur={e => !forgotPasswordLoading && (e.target.style.borderColor = '#3A3F47')}
                />
                <button
                  type="button"
                  onClick={() => !forgotPasswordLoading && setShowNewPassword(s => !s)}
                  disabled={forgotPasswordLoading}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    border: 'none',
                    color: '#A0AEC0',
                    fontSize: '1.1rem',
                    padding: '0.25rem',
                    opacity: forgotPasswordLoading ? 0.5 : 1,
                  }}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <label 
                  htmlFor="confirm-password" 
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#A0AEC0',
                    fontSize: '1.2rem',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}
                  aria-hidden="true"
                >
                  🔒
                </label>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  disabled={forgotPasswordLoading}
                  style={{
                    padding: '0.8rem 0.8rem 0.8rem 2.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #3A3F47',
                    fontSize: '1rem',
                    background: forgotPasswordLoading ? '#2A2E36' : '#1E222A',
                    color: '#E5E7EB',
                    width: '100%',
                    transition: 'border-color 0.2s, background 0.2s',
                    opacity: forgotPasswordLoading ? 0.7 : 1,
                  }}
                  onFocus={e => !forgotPasswordLoading && (e.target.style.borderColor = '#0057D9')}
                  onBlur={e => !forgotPasswordLoading && (e.target.style.borderColor = '#3A3F47')}
                />
                <button
                  type="button"
                  onClick={() => !forgotPasswordLoading && setShowConfirmPassword(s => !s)}
                  disabled={forgotPasswordLoading}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: forgotPasswordLoading ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    border: 'none',
                    color: '#A0AEC0',
                    fontSize: '1.1rem',
                    padding: '0.25rem',
                    opacity: forgotPasswordLoading ? 0.5 : 1,
                  }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={forgotPasswordLoading || !newPassword || !confirmPassword}
                style={{
                  background: (forgotPasswordLoading || !newPassword || !confirmPassword) ? '#3A3F47' : '#2ECC71',
                  color: '#E5E7EB',
                  padding: '0.9rem',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: (forgotPasswordLoading || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem',
                  borderBottom: '3px solid #0057D9',
                  transition: 'background 0.2s, transform 0.1s',
                  opacity: (forgotPasswordLoading || !newPassword || !confirmPassword) ? 0.7 : 1,
                }}
              >
                {forgotPasswordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </>
          )}

          {message && (
            <div style={{ 
              color: message.includes('successfully') ? '#2ECC71' : '#FF6B35', 
              textAlign: 'center', 
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              padding: '0.5rem',
              background: message.includes('successfully') ? 'rgba(46,204,113,0.1)' : 'rgba(255,107,53,0.1)',
              borderRadius: '0.25rem'
            }}>
              {message}
            </div>
          )}
        </form>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 480px) {
          form {
            padding: 1.5rem 1.25rem !important;
            max-width: 100% !important;
            margin: 0.5rem !important;
          }
          
          h2 {
            font-size: 1.5rem !important;
          }
          
          button {
            font-size: 0.95rem !important;
          }
          
          div[style*="position: fixed"] {
            padding: 0.5rem !important;
          }
        }
        
        @media (max-width: 768px) {
          form {
            max-width: 90% !important;
          }
        }
        
        /* Scrollbar styling for modal */
        form::-webkit-scrollbar {
          width: 6px;
        }
        
        form::-webkit-scrollbar-track {
          background: #1E222A;
          border-radius: 3px;
        }
        
        form::-webkit-scrollbar-thumb {
          background: #3A3F47;
          border-radius: 3px;
        }
        
        form::-webkit-scrollbar-thumb:hover {
          background: #4A4F57;
        }
      `}</style>
    </div>
  );
}

export default Login;