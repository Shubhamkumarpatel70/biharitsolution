import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../axios';
import { UserContext } from '../UserContext';
import { Icon } from '../components/icons';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold text-primary-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-sm text-text-muted">
            Join us and start your journey today
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-text-main mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-text-main mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-text-main mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main pr-10"
                  placeholder="Create a password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary-600 transition-colors duration-200 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg text-sm text-center ${message.includes('failed') || message.includes('error')
                ? 'bg-danger-50 text-danger-600 border border-danger-200'
                : 'bg-primary-50 text-primary-700 border border-primary-200'
              }`}>
              {message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-3 rounded-xl text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Registering...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-sm text-center font-medium">
            <span className="text-text-muted">Already have an account? </span>
            <Link to="/login" className="text-primary-600 hover:text-primary-800 transition-colors">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;