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
        </div>
      </form>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          form {
            padding: 1.5rem 1.25rem;
          }
          
          h2 {
            font-size: 1.5rem !important;
          }
          
          button {
            font-size: 0.95rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;