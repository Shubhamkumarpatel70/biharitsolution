import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from '../axios';

const UnsubscribeEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus({ type: 'error', text: 'This unsubscribe link is missing or invalid. Please use the link from your ASKC promotional email.' });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('/api/auth/newsletter/unsubscribe', { token });
      setStatus({ type: 'success', text: res.data?.message || 'You have been unsubscribed successfully.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'This unsubscribe link is invalid or has already been used.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">ASKC TECHNOLOGIES</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Unsubscribe from Promotional Emails</h1>
        <p className="text-sm text-slate-600 mt-2">Use the secure link provided in the promotional email to update your email preferences.</p>
        {status.text ? (
          <div role="status" className={`mt-5 rounded-xl px-4 py-3 text-sm font-medium border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {status.text}
          </div>
        ) : null}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={handleUnsubscribe} disabled={loading || !token} className="btn btn-primary px-6 py-3 rounded-xl justify-center disabled:opacity-50">
            {loading ? 'Unsubscribing...' : 'Confirm Unsubscribe'}
          </button>
          <button type="button" onClick={() => navigate('/')} className="btn btn-secondary px-6 py-3 rounded-xl justify-center">Return to Homepage</button>
        </div>
        <p className="mt-5 text-xs text-slate-500">Need help? <Link to="/contact" className="text-primary-700 font-semibold">Contact support</Link></p>
      </div>
    </section>
  );
};

export default UnsubscribeEmail;
