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
    <div className="admin-redesign-page" style={{ color: '#E5E7EB', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>User Contacts</h2>
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: '#FF6B35' }}>{error}</div>
        ) : contacts.length === 0 ? (
          <div>No contacts found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#E5E7EB' }}>
            <thead>
              <tr style={{ background: '#181A20' }}>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Name</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Email</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Message</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Submitted</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Status</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(contact => (
                <tr key={contact._id} style={{ background: contact.read ? '#1a3320' : '#331a1a', color: contact.read ? '#2ECC71' : '#FF6B35' }}>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{contact.name}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{contact.email}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{contact.message}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{new Date(contact.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333', fontWeight: 700 }}>{contact.read ? 'Read' : 'Unread'}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>
                    {contact.read ? (
                      <button onClick={() => handleMarkUnread(contact._id)} style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '0.3rem', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Mark as Unread</button>
                    ) : (
                      <button onClick={() => handleMarkRead(contact._id)} style={{ background: '#2ECC71', color: '#181A20', border: 'none', borderRadius: '0.3rem', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Mark as Read</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminContacts; 