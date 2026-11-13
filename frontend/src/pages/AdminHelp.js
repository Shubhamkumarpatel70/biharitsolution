import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';

const AdminHelp = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responseMap, setResponseMap] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaints = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/admin/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(res.data.complaints);
      } catch (err) {
        setError('Could not fetch complaints.');
      }
      setLoading(false);
    };
    fetchComplaints();
  }, []);

  const handleRespond = async (id) => {
    const response = responseMap[id];
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/complaints/${id}`, { status: 'resolved', response }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(complaints => complaints.map(c => c._id === id ? { ...c, status: 'resolved', response } : c));
      setResponseMap(map => ({ ...map, [id]: '' }));
    } catch (err) {
      alert('Could not update complaint.');
    }
  };

  const handleReopen = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/auth/admin/complaints/${id}/reopen`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(complaints => complaints.map(c => c._id === id ? { ...c, reopenStatus: action === 'accept' ? 'accepted' : 'rejected', status: action === 'accept' ? 'open' : c.status } : c));
    } catch (err) {
      alert('Could not process reopen request.');
    }
  };

  return (
    <div className="admin-redesign-page" style={{ color: '#E5E7EB', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>User Complaints</h2>
      {loading ? <div>Loading...</div> : error ? <div style={{ color: '#FF6B35' }}>{error}</div> : (
        <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          {complaints.length === 0 ? <div>No complaints found.</div> : (
            <table style={{ width: '100%', color: '#E5E7EB', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#2ECC71', borderBottom: '1px solid #333' }}>
                  <th style={{ padding: '0.5rem' }}>User</th>
                  <th style={{ padding: '0.5rem' }}>Email</th>
                  <th style={{ padding: '0.5rem' }}>Message</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Reopen</th>
                  <th style={{ padding: '0.5rem' }}>Response</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                  <th style={{ padding: '0.5rem' }}>Chat</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => {
                  console.log('AdminHelp complaint:', c);
                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid #333' }}>
                      <td style={{ padding: '0.5rem' }}>{c.user?.name || 'N/A'}</td>
                      <td style={{ padding: '0.5rem' }}>{c.user?.email || 'N/A'}</td>
                      <td style={{ padding: '0.5rem' }}>{c.message}</td>
                      <td style={{ padding: '0.5rem', color: c.status === 'resolved' ? '#2ECC71' : '#FF6B35' }}>{c.status}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {c.reopenStatus === 'pending' ? (
                          <>
                            <button onClick={() => handleReopen(c._id, 'accept')} style={{ background: '#2ECC71', color: '#181A20', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontWeight: 700, cursor: 'pointer', marginRight: 8 }}>Accept</button>
                            <button onClick={() => handleReopen(c._id, 'reject')} style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontWeight: 700, cursor: 'pointer' }}>Reject</button>
                          </>
                        ) : c.reopenStatus === 'accepted' ? <span style={{ color: '#2ECC71' }}>Accepted</span> : c.reopenStatus === 'rejected' ? <span style={{ color: '#FF6B35' }}>Rejected</span> : '-'}</td>
                      <td style={{ padding: '0.5rem' }}>{c.response || (c.status === 'resolved' ? 'No response' : (
                        <input
                          type="text"
                          value={responseMap[c._id] || ''}
                          onChange={e => setResponseMap(map => ({ ...map, [c._id]: e.target.value }))}
                          placeholder="Type response..."
                          style={{ padding: '0.3rem', borderRadius: '0.3rem', border: '1px solid #333', background: '#181A20', color: '#E5E7EB' }}
                        />
                      ))}</td>
                      <td style={{ padding: '0.5rem' }}>{c.status === 'open' && (
                        <button
                          onClick={() => handleRespond(c._id)}
                          style={{ background: '#2ECC71', color: '#181A20', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontWeight: 700, cursor: 'pointer' }}
                          disabled={!responseMap[c._id]}
                        >Resolve</button>
                      )}</td>
                      <td style={{ padding: '0.5rem' }}>
                        {(c._id && (c.status === 'open' || c.reopenStatus === 'accepted')) && (
                          <button onClick={() => navigate(`/support-chat/${c._id}`)} style={{ background: '#0057D9', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.4rem 1rem', fontWeight: 700, cursor: 'pointer' }}>Open Chat</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminHelp; 