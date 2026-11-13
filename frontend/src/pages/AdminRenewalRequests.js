import React, { useState, useEffect } from 'react';
import axios from '../axios';

const AdminRenewalRequests = () => {
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRenewalRequests();
  }, []);

  const fetchRenewalRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/admin/renewal-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRenewalRequests(res.data.subscriptions);
      setLoading(false);
    } catch (err) {
      setError('Could not fetch renewal requests.');
      setLoading(false);
    }
  };

  const handleApprove = async (subscriptionId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/renewal-requests/${subscriptionId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRenewalRequests();
    } catch (err) {
      setError('Could not approve renewal request.');
    }
  };

  const handleReject = async (subscriptionId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/renewal-requests/${subscriptionId}/reject`, 
        { reason }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRenewalRequests();
    } catch (err) {
      setError('Could not reject renewal request.');
    }
  };

  if (loading) return <div style={{ color: '#E5E7EB', textAlign: 'center', padding: '2rem' }}>Loading...</div>;

  return (
    <div className="admin-redesign-page" style={{ color: '#E5E7EB', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>
        Renewal Requests ({renewalRequests.length})
      </h2>
      
      {error && <div style={{ color: '#FF6B35', marginBottom: '1rem' }}>{error}</div>}
      
      {renewalRequests.length === 0 ? (
        <div style={{ 
          background: '#23272F', 
          borderRadius: '1rem', 
          padding: '2rem', 
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          No pending renewal requests
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {renewalRequests.map((request) => (
            <div key={request._id} style={{
              background: '#23272F',
              borderRadius: '1rem',
              padding: '1.5rem',
              border: '1px solid #333'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: '#2ECC71', marginBottom: '0.5rem' }}>
                    {request.user?.name || 'Unknown User'}
                  </h3>
                  <p style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                    {request.user?.email || 'No email'}
                  </p>
                  <p style={{ color: '#E5E7EB' }}>
                    <strong>Plan:</strong> {request.plan.charAt(0).toUpperCase() + request.plan.slice(1)}
                  </p>
                  <p style={{ color: '#E5E7EB' }}>
                    <strong>Current Status:</strong> {request.status}
                  </p>
                  <p style={{ color: '#E5E7EB' }}>
                    <strong>Expires:</strong> {request.expiresAt ? new Date(request.expiresAt).toLocaleDateString() : 'No expiry date'}
                  </p>
                  <p style={{ color: '#E5E7EB' }}>
                    <strong>Renewal Requested:</strong> {new Date(request.renewalRequestDate).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleApprove(request._id)}
                    style={{
                      background: '#2ECC71',
                      color: '#181A20',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    style={{
                      background: '#FF6B35',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRenewalRequests; 