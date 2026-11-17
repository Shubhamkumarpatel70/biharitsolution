import React, { useState, useContext, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from '../axios';
import { UserContext } from '../UserContext';
import { Icon } from '../components/icons';
import OtpInput from '../components/OtpInput';
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
  const [passwordResetToken, setPasswordResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotOtp, setShowForgotOtp] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [firstLoginChallenge, setFirstLoginChallenge] = useState(null);
  const [firstLoginPassword, setFirstLoginPassword] = useState('');
  const [firstLoginConfirmPassword, setFirstLoginConfirmPassword] = useState('');
  const [firstLoginBusy, setFirstLoginBusy] = useState(false);
  const [firstLoginError, setFirstLoginError] = useState('');
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
      if (res.data.requiresPasswordChange) {
        setFirstLoginChallenge({ setupToken: res.data.setupToken, user: res.data.user });
        setFirstLoginPassword(''); setFirstLoginConfirmPassword(''); setFirstLoginError('');
        setLoading(false); setIsSubmitting(false);
        return;
      }
      if (res.data.requiresTwoFactor) {
        setTwoFactorChallenge({ token: res.data.challengeToken, method: res.data.method });
        setTwoFactorCode(''); setMessage(res.data.message || 'Complete two-factor verification to continue.');
        setLoading(false); setIsSubmitting(false); return;
      }
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


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const challengeToken = params.get('twoFactorToken');
    const method = params.get('twoFactorMethod');
    if (challengeToken && ['email', 'authenticator'].includes(method)) {
      setTwoFactorChallenge({ token: challengeToken, method });
      setMessage(method === 'email' ? 'A verification code was sent to your registered email.' : 'Enter the current code from your authenticator app.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('twoFactorError') === 'email') {
      setMessage('Could not send the verification email. Please sign in again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search]);

  const handleFirstLoginPasswordChange = async event => {
    event.preventDefault();
    if (!firstLoginChallenge?.setupToken || firstLoginBusy) return;
    if (firstLoginPassword.length < 8) { setFirstLoginError('Password must be at least 8 characters.'); return; }
    if (firstLoginPassword !== firstLoginConfirmPassword) { setFirstLoginError('Passwords do not match.'); return; }
    setFirstLoginBusy(true); setFirstLoginError("");
    try {
      const response = await axios.post('/api/auth/first-login/change-password', { setupToken: firstLoginChallenge.setupToken, newPassword: firstLoginPassword, confirmPassword: firstLoginConfirmPassword });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user); setFirstLoginChallenge(null);
      navigate('/dashboard', { replace: true });
    } catch (error) { setFirstLoginError(error.response?.data?.message || "Could not save your new password. Please try again."); }
    finally { setFirstLoginBusy(false); }
  };
  const handleVerifyTwoFactor = async e => {
    e.preventDefault();
    if (!twoFactorChallenge || twoFactorCode.length !== 6 || twoFactorBusy) return;
    setTwoFactorBusy(true); setMessage('');
    try {
      const res = await axios.post('/api/auth/2fa/login/verify', { challengeToken: twoFactorChallenge.token, code: twoFactorCode });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      if (['admin','coadmin'].includes(res.data.user?.role)) navigate('/admin-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally { setTwoFactorBusy(false); }
  };

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
        setPasswordResetToken('');
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
      setPasswordResetToken('');
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
    if (forgotOtp.length !== 6) {
      setMessage('Please enter all 6 digits.');
      return;
    }
    setForgotPasswordLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/auth/forgot-password/verify-otp', { email: forgotEmail.trim(), otp: forgotOtp.trim() });
      setUserInfo(res.data.user);
      setPasswordResetToken(res.data.resetToken || '');
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
    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match. Please try again.');
      return;
    }
    setForgotPasswordLoading(true);
    setMessage('');
    try {
      if (!passwordResetToken) { setMessage('Please verify your email OTP again before resetting your password.'); return; }
      await axios.post('/api/auth/forgot-password/reset', { resetToken: passwordResetToken, newPassword });
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setUserInfo(null);
        setPasswordResetToken('');
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
      {twoFactorChallenge ? (
        <form onSubmit={handleVerifyTwoFactor} className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 flex flex-col gap-5">
          <div className="text-center"><h1 className="text-2xl font-bold text-primary-900">Two-factor verification</h1><p className="mt-2 text-sm text-slate-500">{twoFactorChallenge.method === 'email' ? 'Enter the 6-digit code sent to your registered email.' : 'Enter the current 6-digit code from your authenticator app.'}</p></div>
          <OtpInput length={6} value={twoFactorCode} onChange={value => setTwoFactorCode(value.replace(/\D/g, '').slice(0,6))} disabled={twoFactorBusy} />
          {message && <p role="status" className="rounded-xl bg-blue-50 px-3 py-2 text-center text-sm text-blue-800">{message}</p>}
          <button type="submit" disabled={twoFactorBusy || twoFactorCode.length !== 6} className="btn btn-primary w-full justify-center rounded-xl disabled:opacity-50">{twoFactorBusy ? 'Verifying…' : 'Verify and sign in'}</button>
          <button type="button" onClick={() => { setTwoFactorChallenge(null); setTwoFactorCode(''); setMessage(''); loadCaptcha({ quiet: true }); }} className="text-sm font-semibold text-primary-600">Back to sign in</button>
        </form>
      ) : (
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary-900 tracking-tight">Sign in</h1>
          <p className="text-text-muted text-sm mt-1">Welcome back to ASKC TECHNOLOGIES</p>
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
      )}

      {firstLoginChallenge && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={handleFirstLoginPasswordChange} className="w-full max-w-lg space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl sm:p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon name="lock" className="h-7 w-7" /></div>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-widest text-blue-600">ASKC TECHNOLOGIES</p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-900">Change your password</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Welcome, {firstLoginChallenge.user?.name || "Client"}. Create a new password before continuing to your dashboard.</p>
            </div>
            <label className="block text-sm font-bold">New password
              <input type="password" required minLength="8" maxLength="128" autoComplete="new-password" value={firstLoginPassword} onChange={event => setFirstLoginPassword(event.target.value)} placeholder="Enter a new password" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block text-sm font-bold">Confirm new password
              <input type="password" required minLength="8" maxLength="128" autoComplete="new-password" value={firstLoginConfirmPassword} onChange={event => setFirstLoginConfirmPassword(event.target.value)} placeholder="Re-enter your new password" className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <p className="text-xs text-slate-500">Use at least 8 characters. The temporary password cannot be reused.</p>
            {firstLoginError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{firstLoginError}</p>}
            <button type="submit" disabled={firstLoginBusy || firstLoginPassword.length < 8 || !firstLoginConfirmPassword} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
              {firstLoginBusy ? 'Saving password…' : 'Save new password & continue'}
            </button>
          </form>
        </div>
      )}
      {showForgotPassword && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-md"
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
            className="relative my-auto w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white text-slate-800 shadow-[0_30px_100px_-25px_rgba(2,6,23,0.65)]"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-[#102b55] via-[#153b70] to-[#0b1e3b] px-6 pb-8 pt-7 text-white sm:px-9">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/5" />
              <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-accent-400/10 blur-2xl" />
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
                className="absolute right-5 top-5 z-10 rounded-full border border-white/15 bg-white/10 p-2.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Close forgot password"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
              <div className="relative flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent-300/25 bg-accent-400/15 text-accent-300 shadow-inner">
                  <Icon name="lock" className="h-6 w-6" />
                </div>
                <div>
                  <div className="leading-tight"><p className="text-sm font-extrabold tracking-wide text-white">ASKC</p><p className="mt-0.5 text-sm font-extrabold tracking-wide text-accent-300">TECHNOLOGIES</p></div>
                  <p className="mt-1 text-sm text-white/65">Account recovery</p>
                </div>
              </div>
              <h2 className="relative mt-7 pr-8 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {userInfo ? 'Create a new password' : (showForgotOtp ? 'Verify your email' : 'Forgot your password?')}
              </h2>
              <p className="relative mt-2 max-w-sm text-sm leading-6 text-white/70">
                {userInfo
                  ? 'Choose a strong password to secure your account.'
                  : (showForgotOtp
                    ? 'Enter the 6-digit code we sent to your registered email address.'
                    : 'No worries. We’ll help you get back into your account in a few simple steps.')}
              </p>
              <div className="relative mt-7 flex items-center gap-2">
                {['Email', 'Verify', 'Reset'].map((step, index) => {
                  const activeIndex = userInfo ? 2 : (showForgotOtp ? 1 : 0);
                  const completed = index < activeIndex;
                  const active = index === activeIndex;
                  return (
                    <div key={step} className="flex flex-1 items-center gap-2">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${completed ? 'border-accent-300 bg-accent-300 text-primary-950' : active ? 'border-accent-300 bg-accent-300/15 text-accent-200' : 'border-white/20 bg-white/5 text-white/45'}`}>
                        {completed ? '✓' : index + 1}
                      </div>
                      <span className={`hidden text-xs font-semibold sm:inline ${active ? 'text-white' : completed ? 'text-accent-200' : 'text-white/45'}`}>{step}</span>
                      {index < 2 && <div className={`h-px flex-1 ${completed ? 'bg-accent-300/70' : 'bg-white/15'}`} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-5 px-6 py-7 sm:px-9 sm:py-8">
              {!userInfo ? (
                !showForgotOtp ? (
                  <>
                    <div className="space-y-1">
                      <label htmlFor="forgot-email" className="text-sm font-bold text-slate-700">Registered email address</label>
                      <p className="text-xs leading-5 text-slate-500">We’ll send a one-time verification code to this email.</p>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon name="mail" className="h-5 w-5" />
                      </span>
                      <input
                        id="forgot-email"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                        disabled={forgotPasswordLoading}
                        autoComplete="email"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 disabled:opacity-60"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading || !forgotEmail.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-800 to-primary-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {forgotPasswordLoading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending code…</> : <>Send verification code <Icon name="arrowRight" className="h-4 w-4" /></>}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-primary-100 bg-primary-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-500">Code sent to</p>
                      <p className="mt-1 break-all text-sm font-bold text-primary-950">{forgotEmail}</p>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700">6-digit verification code</label>
                      <OtpInput length={6} value={forgotOtp} onChange={setForgotOtp} disabled={forgotPasswordLoading} />
                    </div>
                    <button
                      type="submit"
                      disabled={forgotPasswordLoading || forgotOtp.trim().length !== 6}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-800 to-primary-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {forgotPasswordLoading ? 'Verifying code…' : <>Verify code <Icon name="arrowRight" className="h-4 w-4" /></>}
                    </button>
                    <button type="button" onClick={() => { setShowForgotOtp(false); setForgotOtp(''); setMessage(''); }} className="w-full text-sm font-semibold text-primary-700 transition hover:text-primary-900">
                      Change email address
                    </button>
                  </>
                )
              ) : (
                <>
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Icon name="check" className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Verified account</p>
                      <p className="truncate text-sm font-bold text-slate-800">{userInfo.name}</p>
                      <p className="truncate text-xs text-slate-500">{userInfo.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="new-password" className="text-sm font-bold text-slate-700">New password</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="lock" className="h-5 w-5" /></span>
                      <input id="new-password" type={showNewPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={forgotPasswordLoading} autoComplete="new-password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 disabled:opacity-60" />
                      <button type="button" onClick={() => !forgotPasswordLoading && setShowNewPassword((s) => !s)} disabled={forgotPasswordLoading} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-700" aria-label={showNewPassword ? 'Hide password' : 'Show password'}><Icon name={showNewPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="confirm-password" className="text-sm font-bold text-slate-700">Confirm new password</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="lock" className="h-5 w-5" /></span>
                      <input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={forgotPasswordLoading} autoComplete="new-password" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 disabled:opacity-60" />
                      <button type="button" onClick={() => !forgotPasswordLoading && setShowConfirmPassword((s) => !s)} disabled={forgotPasswordLoading} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-primary-700" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}><Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <button type="submit" disabled={forgotPasswordLoading || !newPassword || !confirmPassword} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
                    {forgotPasswordLoading ? 'Updating password…' : <>Update password <Icon name="check" className="h-4 w-4" /></>}
                  </button>
                  <p className="text-center text-xs text-slate-500">Use at least 6 characters. Avoid reusing an old password.</p>
                </>
              )}

              {message && (
                <div role="status" className={`rounded-2xl border px-4 py-3 text-center text-sm font-medium ${message.toLowerCase().includes('successfully') || message.toLowerCase().includes('otp sent') ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                  {message}
                </div>
              )}
              <div className="border-t border-slate-100 pt-4 text-center">
                <button type="button" onClick={() => { setShowForgotPassword(false); setForgotEmail(''); setUserInfo(null); setNewPassword(''); setConfirmPassword(''); setShowForgotOtp(false); setForgotOtp(''); setMessage(''); }} className="text-sm font-semibold text-slate-500 transition hover:text-primary-700">
                  Back to sign in
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Login;
