import React, { useState, useContext, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../axios';
import { UserContext } from '../UserContext';
import { Icon } from '../components/icons';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);
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
  const [showForgotOtp, setShowForgotOtp] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useContext(UserContext);
  const submitTimeoutRef = useRef(null);

  const loadCaptcha = useCallback(async (options = {}) => {
    const { quiet = false } = options;
    setCaptchaLoading(true);
    setCaptchaInput('');
    try {
      const res = await axios.get('/api/auth/captcha');
      setCaptchaId(res.data.captchaId || '');
      setCaptchaSvg(res.data.svg || '');
    } catch {
      setCaptchaId('');
      setCaptchaSvg('');
      if (!quiet) {
        setMessage('Could not load security check. Please refresh the page.');
      }
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const validateForm = useCallback(() => {
    return (
      email.trim() &&
      password.trim() &&
      email.includes('@') &&
      captchaId &&
      captchaInput.trim().length > 0
    );
  }, [email, password, captchaId, captchaInput]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting || loading) return;
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    if (!validateForm()) {
      setMessage('Please enter valid email and password.');
      return;
    }
    setIsSubmitting(true);
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/auth/login', {
        email: email.trim(),
        password,
        captchaId,
        captchaAnswer: captchaInput.trim(),
      });
      localStorage.setItem('token', res.data.token);
      if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      if (res.data.user && (res.data.user.role === 'admin' || res.data.user.role === 'coadmin')) {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      setIsSubmitting(false);
      loadCaptcha({ quiet: true });
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
  }, [email, password, captchaId, captchaInput, isSubmitting, loading, validateForm, setUser, navigate, loadCaptcha]);

  React.useEffect(() => {
    if (!isSubmitting && !loading) {
      setLoading(false);
      setIsSubmitting(false);
    }
  }, [isSubmitting, loading]);

  React.useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  React.useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && showForgotPassword) {
        setShowForgotPassword(false);
        setForgotEmail('');
        setUserInfo(null);
        setNewPassword('');
        setConfirmPassword('');
        setShowForgotOtp(false);
        setForgotOtp('');
        setMessage('');
      }
    };
    if (showForgotPassword) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showForgotPassword]);

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }
    setForgotPasswordLoading(true);
    setMessage('');
    try {
      await axios.post('/api/auth/forgot-password/send-otp', { email: forgotEmail.trim() });
      setShowForgotOtp(true);
      setMessage('OTP sent to your email.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      setMessage('Please enter the OTP.');
      return;
    }
    setForgotPasswordLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password/verify-otp', { email: forgotEmail.trim(), otp: forgotOtp.trim() });
      setUserInfo(res.data.user);
      setShowForgotOtp(false);
      setMessage('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

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
      await axios.post('/api/auth/forgot-password/reset', { email: forgotEmail.trim(), newPassword });
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setUserInfo(null);
        setNewPassword('');
        setConfirmPassword('');
        setShowForgotOtp(false);
        setForgotOtp('');
        setMessage('');
        navigate('/login', { state: { success: 'Password reset successfully! Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not reset password. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !isSubmitting && !loading) handleSubmit(e);
    },
    [handleSubmit, isSubmitting, loading]
  );

  const inputClass =
    'w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-text-main text-base transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/25 focus:border-primary-500 disabled:opacity-60';
  const inputDarkClass =
    'w-full pl-11 pr-11 py-3 rounded-xl border border-gray-600 bg-primary-900/40 text-white placeholder:text-gray-500 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 disabled:opacity-60';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12 sm:py-16 pt-24 sm:pt-28">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 tracking-tight">Sign in</h1>
          <p className="text-text-muted text-sm mt-1">Welcome back to askc web</p>
        </div>

        {location.state?.success && (
          <div className="text-center text-sm font-medium text-success-600 bg-success-500/10 border border-success-500/20 rounded-xl py-2.5 px-3">
            {location.state.success}
          </div>
        )}

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden>
            <Icon name="mail" className="w-5 h-5" />
          </span>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            disabled={loading}
            className={inputClass}
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" aria-hidden>
            <Icon name="lock" className="w-5 h-5" />
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            required
            disabled={loading}
            className={`${inputClass} pr-12`}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => !loading && setShowPassword((s) => !s)}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-text-muted hover:text-primary-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="captcha-input" className="text-sm font-semibold text-text-main">
              Verification code
            </label>
            <button
              type="button"
              onClick={() => !captchaLoading && !loading && loadCaptcha()}
              disabled={captchaLoading || loading}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-primary-600 hover:bg-primary-50 hover:border-primary-200 disabled:opacity-50 transition-colors"
              aria-label="Load new verification code"
              title="New code"
            >
              <Icon name="refresh" className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
          {/* <p className="text-xs text-text-muted leading-snug">
            Enter the characters shown (0–9, A–Z, a–z). Matching is case-sensitive.
          </p> */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden min-h-[4rem] flex items-center justify-center px-2 py-2">
              {captchaLoading ? (
                <span className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" aria-hidden />
              ) : captchaSvg ? (
                <img
                  src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(captchaSvg)}`}
                  alt="Captcha characters"
                  className="max-w-full h-auto max-h-[4.5rem]"
                  draggable={false}
                />
              ) : (
                <span className="text-xs text-danger-600 text-center px-2">Could not load code</span>
              )}
            </div>
            <input
              id="captcha-input"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Type the code"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              disabled={loading || captchaLoading || !captchaId}
              className={`${inputClass} flex-1 min-w-0 pl-4`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isSubmitting || !validateForm() || captchaLoading || !captchaId}
          className="btn btn-primary w-full justify-center text-base rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            'Sign in'
          )}
        </button>

        {message && !showForgotPassword && (
          <div className="text-center text-sm text-danger-600 bg-danger-500/10 border border-danger-500/20 rounded-xl py-2.5 px-3">{message}</div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
          <span className="text-text-muted text-center sm:text-left">
            No account?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create one
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
              setShowForgotOtp(false);
              setForgotOtp('');
            }}
            className="font-semibold text-primary-600 hover:text-primary-700 text-center sm:text-right bg-transparent border-none cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
      </form>

      {showForgotPassword && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-primary-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForgotPassword(false);
              setForgotEmail('');
              setUserInfo(null);
              setNewPassword('');
              setConfirmPassword('');
              setShowForgotOtp(false);
              setForgotOtp('');
              setMessage('');
            }
          }}
        >
          <form
            onSubmit={userInfo ? handleResetPassword : (showForgotOtp ? handleVerifyForgotOtp : handleSendForgotOtp)}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-primary-950 border border-primary-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4 text-gray-100"
          >
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail('');
                setUserInfo(null);
                setNewPassword('');
                setConfirmPassword('');
                setShowForgotOtp(false);
                setForgotOtp('');
                setMessage('');
              }}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
              aria-label="Close"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-center text-white pr-8">{userInfo ? 'Reset password' : (showForgotOtp ? 'Verify OTP' : 'Forgot password')}</h2>

            {!userInfo ? (
              !showForgotOtp ? (
                <>
                  <p className="text-sm text-gray-400 text-center">Enter your email and we&apos;ll send an OTP to reset your password.</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden>
                      <Icon name="mail" className="w-5 h-5" />
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="Your email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      disabled={forgotPasswordLoading}
                      className={inputDarkClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || !forgotEmail.trim()}
                    className="btn btn-primary w-full justify-center rounded-xl bg-accent-500 hover:bg-accent-400 text-primary-900 border-0"
                  >
                    {forgotPasswordLoading ? 'Sending…' : 'Send OTP'}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-400 text-center">Enter the verification code sent to your email.</p>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden>
                      <Icon name="lock" className="w-5 h-5" />
                    </span>
                    <input
                      id="forgot-otp"
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      required
                      disabled={forgotPasswordLoading}
                      className={inputDarkClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotPasswordLoading || !forgotOtp.trim()}
                    className="btn btn-primary w-full justify-center rounded-xl bg-accent-500 hover:bg-accent-400 text-primary-900 border-0"
                  >
                    {forgotPasswordLoading ? 'Verifying…' : 'Verify OTP'}
                  </button>
                </>
              )
            ) : (
              <>
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm">
                  <p className="text-gray-400 mb-2">Account</p>
                  <p className="font-semibold text-white">{userInfo.name}</p>
                  <p className="text-accent-400">{userInfo.email}</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden>
                    <Icon name="lock" className="w-5 h-5" />
                  </span>
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={forgotPasswordLoading}
                    className={`${inputDarkClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => !forgotPasswordLoading && setShowNewPassword((s) => !s)}
                    disabled={forgotPasswordLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showNewPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden>
                    <Icon name="lock" className="w-5 h-5" />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={forgotPasswordLoading}
                    className={`${inputDarkClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => !forgotPasswordLoading && setShowConfirmPassword((s) => !s)}
                    disabled={forgotPasswordLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={forgotPasswordLoading || !newPassword || !confirmPassword}
                  className="btn w-full justify-center rounded-xl bg-success text-white border-0 hover:bg-success-400"
                >
                  {forgotPasswordLoading ? 'Updating…' : 'Update password'}
                </button>
              </>
            )}

            {message && (
              <div
                className={`text-center text-sm rounded-xl py-2.5 px-3 ${
                  message.includes('successfully') ? 'text-success-400 bg-success-500/15 border border-success-500/25' : 'text-orange-300 bg-orange-500/10 border border-orange-500/20'
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
