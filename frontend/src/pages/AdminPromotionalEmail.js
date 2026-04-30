import React, { useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const AdminPromotionalEmail = () => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/auth/admin/promotional-email',
        {
          email: email.trim().toLowerCase(),
          subject: subject.trim(),
          message: message.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus({ type: 'success', text: res.data?.message || 'Email sent successfully.' });
      setMessage('');
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'Could not send promotional email.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Promotional Email</h2>
        <p className="text-sm text-slate-500 mt-1">
          Send promotional email to a user with unsubscribe link included in footer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">User Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
            placeholder="Special offer for you"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
          <textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40 resize-y"
            placeholder="Enter promotional content here..."
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

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Icon name="mail" className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send Promotional Email'}
        </button>
      </form>
    </div>
  );
};

export default AdminPromotionalEmail;
