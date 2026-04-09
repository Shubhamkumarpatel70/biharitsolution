import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/icons';

const HelpAndSupport = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/complaints', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data.complaints || []);
    } catch {
      setError('Could not fetch your support tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter a message for your complaint.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/auth/complaints',
        { message: message.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('');
      fetchComplaints();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit your complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusClass = (status) => {
    if (status === 'resolved') return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    return 'text-amber-700 bg-amber-100 border-amber-200';
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary-900">Help & Support</h2>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3">Submit a New Complaint</h3>
        <form onSubmit={handleSubmitComplaint} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please describe your issue in detail..."
            className="w-full min-h-[120px] p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          {error && (
            <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">{error}</div>
          )}
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg sm:text-xl font-semibold text-slate-900">Your Support Tickets</h3>
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-600">Loading tickets...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            You have not submitted any complaints yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {complaints.map((c) => (
              <li key={c._id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-slate-800 leading-relaxed break-words">{c.message}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      Submitted: {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="sm:text-right flex sm:block gap-2">
                    <span className={`inline-flex items-center gap-1 border rounded-full px-3 py-1 text-xs font-semibold ${statusClass(c.status)}`}>
                      <Icon name={c.status === 'resolved' ? 'check' : 'clock'} className="w-3.5 h-3.5" />
                      {c.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/support-chat/${c._id}`)}
                      className="inline-flex items-center justify-center rounded-lg px-4 py-2 bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
                    >
                      View Chat
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HelpAndSupport;
