import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../axios';
import { Icon } from '../components/icons';

const statusColor = {
  open: 'text-amber-700 bg-amber-100 border-amber-200',
  resolved: 'text-emerald-700 bg-emerald-100 border-emerald-200',
};

const SupportChat = () => {
  const { complaintId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/auth/complaints/${complaintId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaint(res.data.complaint);
      setError('');
    } catch (err) {
      if (err.response?.status === 401) setError('Not authorized. Please log in again.');
      else if (err.response?.status === 404) setError('Complaint not found or you do not have access.');
      else setError('Could not load complaint.');
    }
  }, [complaintId]);

  const fetchChat = useCallback(async () => {
    if (!complaintId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/auth/complaints/${complaintId}/chat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.chat || []);
    } catch {
      // keep previous messages on intermittent errors
    }
  }, [complaintId]);

  useEffect(() => {
    if (!complaintId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchComplaint(), fetchChat()]);
      setLoading(false);
    };
    load();
  }, [complaintId, fetchComplaint, fetchChat]);

  // Real-time feel via polling every 3s
  useEffect(() => {
    if (!complaintId) return undefined;
    const id = setInterval(() => {
      fetchChat();
      fetchComplaint();
    }, 3000);
    return () => clearInterval(id);
  }, [complaintId, fetchChat, fetchComplaint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    setSendError('');
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `/api/auth/complaints/${complaintId}/chat`,
        { text: input.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.chat || []);
      setInput('');
    } catch {
      setSendError('Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const canChat = complaint && (complaint.status === 'open' || complaint.reopenStatus === 'accepted');

  if (!complaintId) {
    return (
      <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-center">
        <h2 className="text-red-600 text-xl font-bold mb-2">No complaint selected</h2>
        <p className="text-slate-600 mb-4">Please select a complaint from your dashboard to view the chat.</p>
        <Link to="/dashboard/support" className="btn btn-primary">Go to support</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">Support Chat</h2>

      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
      ) : !complaint ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-slate-600">Complaint not found.</div>
      ) : (
        <>
          <div className="mb-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-sm sm:text-base text-slate-800"><strong>Issue:</strong> {complaint.message}</p>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold ${statusColor[complaint.status] || 'text-slate-700 bg-slate-100 border-slate-200'}`}>
                <Icon name={complaint.status === 'resolved' ? 'check' : 'clock'} className="w-4 h-4" />
                {complaint.status}
              </span>
            </div>
            {complaint.status === 'resolved' && <p className="mt-2 text-emerald-700 text-sm">This complaint is resolved. Chat is closed.</p>}
            {complaint.reopenStatus === 'pending' && <p className="mt-2 text-amber-700 text-sm">Reopen requested (awaiting admin).</p>}
            {complaint.reopenStatus === 'rejected' && <p className="mt-2 text-red-700 text-sm">Reopen rejected by admin.</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-3 sm:p-4">
            <div className="h-[48vh] min-h-[260px] max-h-[520px] overflow-y-auto px-1 sm:px-2">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No messages yet.</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`my-2 flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        msg.from === 'user'
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'bg-emerald-100 text-emerald-900 rounded-bl-md border border-emerald-200'
                      }`}
                    >
                      <p className="mb-0 whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={canChat ? 'Type your message...' : 'Chat is closed for this complaint.'}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                disabled={!canChat || sending}
              />
              <button
                type="submit"
                disabled={!canChat || sending}
                className="px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
            {sendError && <div className="text-red-600 mt-2 text-sm">{sendError}</div>}
          </div>
        </>
      )}
    </div>
  );
};

export default SupportChat;