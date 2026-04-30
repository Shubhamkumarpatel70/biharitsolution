import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../axios';

const UnsubscribeEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryEmail = useMemo(() => new URLSearchParams(location.search).get('email') || '', [location.search]);
  const [email, setEmail] = useState(queryEmail);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    if (!email.trim()) {
      setStatus({ type: 'error', text: 'Please enter your email.' });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/newsletter/unsubscribe', {
        email: email.trim().toLowerCase()
      });
      setStatus({ type: 'success', text: res.data?.message || 'You have been unsubscribed successfully.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Could not unsubscribe.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Unsubscribe from Promotional Emails</h1>
        <p className="text-sm text-slate-600 mt-2">
          Confirm your email and unsubscribe. You can cancel and return to homepage.
        </p>

        <form onSubmit={handleUnsubscribe} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
              placeholder="you@example.com"
              required
            />
          </div>

          {status.text ? (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                status.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {status.text}
            </div>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary px-6 py-3 rounded-xl justify-center"
            >
              {loading ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-secondary px-6 py-3 rounded-xl justify-center"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="mt-5 text-xs text-slate-500">
          Need help? <Link to="/contact" className="text-primary-700 font-semibold">Contact support</Link>
        </p>
      </div>
    </section>
  );
};

export default UnsubscribeEmail;
