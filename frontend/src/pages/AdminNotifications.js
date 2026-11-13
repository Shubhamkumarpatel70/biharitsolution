import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState('');
  const [sendMsg, setSendMsg] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [autoMsg, setAutoMsg] = useState('');

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
    } catch {
      setError('Could not fetch notifications.');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch {}
  };

  useEffect(() => { fetchNotifications(); fetchUsers(); }, []);

  const sendNotification = async () => {
    setSendMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/admin/notifications', { message: form, userId: selectedUser }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSendMsg('Notification sent!');
      setForm('');
      setSelectedUser('');
      fetchNotifications();
    } catch {
      setSendMsg('Could not send notification.');
    }
  };

  const autoSendExpiryNotifications = async () => {
    setAutoMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/admin/auto-expiry-notifications', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAutoMsg('Auto notifications sent to users with expiring plans!');
    } catch {
      setAutoMsg('Could not send auto notifications.');
    }
  };

  return (
    <div className="admin-redesign-page" style={{ maxWidth: 700, margin: '0 auto', color: '#E5E7EB' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>Notifications</h2>
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
        <h4 style={{ color: '#2ECC71', marginBottom: '1rem' }}>Send Notification</h4>
        <textarea value={form} onChange={e => setForm(e.target.value)} placeholder="Enter notification message" style={{ width: '100%', minHeight: 60, marginBottom: '0.7rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#181A20', color: '#E5E7EB', padding: '0.7rem' }} />
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ width: '100%', marginBottom: '0.7rem', padding: '0.7rem', borderRadius: '0.5rem', border: '1px solid #333', background: '#181A20', color: '#E5E7EB' }}>
          <option value="">Send to all users</option>
          {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
        </select>
        <button onClick={sendNotification} style={{ background: '#2ECC71', color: '#181A20', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginRight: '0.7rem' }}>Send</button>
        {sendMsg && <span style={{ color: '#2ECC71', marginLeft: '1rem' }}>{sendMsg}</span>}
      </div>
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
        <h4 style={{ color: '#2ECC71', marginBottom: '1rem' }}>Auto Plan Expiry Notifications</h4>
        <button onClick={autoSendExpiryNotifications} style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginRight: '0.7rem' }}>Send to users with 2 days left</button>
        {autoMsg && <span style={{ color: '#2ECC71', marginLeft: '1rem' }}>{autoMsg}</span>}
      </div>
      <h4 style={{ color: '#2ECC71', marginBottom: '1rem' }}>All Notifications</h4>
      {error && <div style={{ color: '#FF6B35', marginBottom: '1rem' }}>{error}</div>}
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '1.2rem', maxHeight: 300, overflowY: 'auto' }}>
        {notifications.length === 0 ? <div style={{ color: '#A0AEC0' }}>No notifications found.</div> : notifications.map((n, i) => (
          <div key={i} style={{ borderBottom: '1px solid #333', padding: '0.7rem 0' }}>
            <div style={{ fontWeight: 700 }}>{n.message}</div>
            <div style={{ color: '#A0AEC0', fontSize: '0.95rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications; 