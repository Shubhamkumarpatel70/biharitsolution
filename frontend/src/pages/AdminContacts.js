import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/contacts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContacts(res.data.contacts);
      } catch (err) {
        setError('Could not fetch contacts.');
      }
      setLoading(false);
    };
    fetchContacts();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/contacts/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(contacts => contacts.map(c => c._id === id ? { ...c, read: true } : c));
    } catch {}
  };

  const handleMarkUnread = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/contacts/${id}/unread`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(contacts => contacts.map(c => c._id === id ? { ...c, read: false } : c));
    } catch {}
  };

  return (
    <div className="admin-redesign-page mx-auto w-full max-w-7xl space-y-5 px-1 text-slate-800 sm:px-2">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-sky-600">Communication centre</p><h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Contact messages</h2><p className="mt-1 text-sm text-slate-500">Review enquiries and track read status.</p></div><div className="flex gap-2 text-xs font-semibold"><span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">{contacts.length} total</span><span className="rounded-full bg-amber-50 px-3 py-2 text-amber-800">{contacts.filter(c => !c.read).length} unread</span></div></div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: '#FF6B35' }}>{error}</div>
        ) : contacts.length === 0 ? (
          <div>No contacts found.</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact._id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                  <td className="px-4 py-3">{contact.name}</td>
                  <td className="px-4 py-3">{contact.email}</td>
                  <td className="px-4 py-3">{contact.message}</td>
                  <td className="px-4 py-3">{new Date(contact.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">{contact.read ? 'Read' : 'Unread'}</td>
                  <td className="px-4 py-3">
                    {contact.read ? (
                      <button onClick={() => handleMarkUnread(contact._id)} className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900">Mark as Unread</button>
                    ) : (
                      <button onClick={() => handleMarkRead(contact._id)} className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700">Mark as Read</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </div>
  );
};

export default AdminContacts; 