import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AdminUserPlans = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const usersRes = await axios.get('/api/auth/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const subsRes = await axios.get('/api/auth/admin/all-subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const users = usersRes.data.users;
        const allSubs = subsRes.data.subscriptions;
        const planData = users.map(user => {
          const userSubs = allSubs.filter(s => (s.user && (s.user._id === user._id)));
          const latest = userSubs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          return {
            name: user.name,
            email: user.email,
            plan: latest ? latest.plan : 'None',
            expiresAt: latest && latest.expiresAt ? new Date(latest.expiresAt).toLocaleDateString() : 'N/A',
            status: latest ? latest.status : 'N/A',
          };
        });
        setData(planData);
      } catch (err) {
        setError('Could not fetch user plans.');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="admin-redesign-page" style={{ maxWidth: 900, margin: '0 auto', color: '#E5E7EB' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>User Plans</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: '#FF6B35' }}>{error}</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#23272F', borderRadius: '1rem', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#181A20' }}>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>Plan</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>Expires At</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '0.8rem' }}>{u.name}</td>
                <td style={{ padding: '0.8rem' }}>{u.email}</td>
                <td style={{ padding: '0.8rem' }}>{u.plan}</td>
                <td style={{ padding: '0.8rem' }}>{u.status}</td>
                <td style={{ padding: '0.8rem' }}>{u.expiresAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUserPlans; 