import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';

const planDisplayNames = {
  starter: 'Starter',
  premium: 'Premium',
  pro: 'Pro',
};

const MyPurchases = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestStatus, setRequestStatus] = useState({});
  const navigate = useNavigate();

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/user-subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscriptions(res.data.subscriptions);
    } catch (err) {
      setError('Could not fetch purchases.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleRenewalRequest = async (subscriptionId) => {
    setRequestStatus({ ...requestStatus, [subscriptionId]: 'pending' });
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/auth/renewal-request',
        { subscriptionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequestStatus({ ...requestStatus, [subscriptionId]: 'success' });
      // Refresh subscriptions to show the updated status
      fetchSubscriptions();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Could not submit renewal request.';
      setError(errorMessage);
      setRequestStatus({ ...requestStatus, [subscriptionId]: 'error' });
    }
  };

  return (
    <div style={{ color: '#E5E7EB', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>My Purchases</h2>
      {error && <div style={{ color: '#FF6B35', background: 'rgba(255, 107, 53, 0.1)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div>Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div>No purchases found.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {subscriptions.map((sub) => {
              const isExpired = sub.status === 'expired';
              const isRenewalPending = sub.renewalStatus === 'pending';
              const showRenewButton = isExpired && !isRenewalPending;

              return (
                <li key={sub._id} style={{ marginBottom: '1.5rem', background: '#181A20', borderRadius: '0.5rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div><b>Plan:</b> {planDisplayNames[sub.plan]}</div>
                      <div><b>Subscription ID:</b> {sub.uniqueId}</div>
                      <div><b>Status:</b> <span style={{ color: sub.status === 'active' ? '#2ECC71' : '#FF6B35', fontWeight: 700 }}>{sub.status}</span></div>
                      {cancellationApproved && (
                        <div style={{ color: '#FF6B35', fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem' }}>
                          ❌ Plan Cancelled
                        </div>
                      )}
                      {sub.expiresAt && <div style={{ fontSize: '0.95rem', color: '#A0AEC0' }}>Expires: {new Date(sub.expiresAt).toLocaleString()}</div>}
                    </div>
                    {isExpired && !isRenewalPending && !cancellationApproved && (
                      <span style={{ background: '#FF6B35', color: '#fff', borderRadius: '0.7rem', padding: '0.2rem 0.8rem', fontWeight: 700, fontSize: '0.95rem' }}>Expired</span>
                    )}
                    {cancellationApproved && (
                      <span style={{ background: '#FF6B35', color: '#fff', borderRadius: '0.7rem', padding: '0.2rem 0.8rem', fontWeight: 700, fontSize: '0.95rem' }}>Cancelled</span>
                    )}
                  </div>

                  {isRenewalPending && (
                    <div style={{ background: 'rgba(255, 165, 0, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#FFA500', fontWeight: 600 }}>
                      Renewal request is pending approval from admin.
                    </div>
                  )}
                  
                  {sub.renewalStatus === 'rejected' && (
                     <div style={{ background: 'rgba(255, 107, 53, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#FF6B35', fontWeight: 600 }}>
                       <strong>Renewal Rejected:</strong> {sub.renewalRejectionReason}
                     </div>
                  )}

                  {cancellationPending && (
                    <div style={{ background: 'rgba(255, 165, 0, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#FFA500', fontWeight: 600 }}>
                      ⏳ Cancellation request is pending approval from admin.
                    </div>
                  )}

                  {cancellationApproved && (
                    <div style={{ background: 'rgba(255, 107, 53, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#FF6B35', fontWeight: 700 }}>
                      ❌ Plan Cancelled - Your subscription has been cancelled and is now inactive.
                    </div>
                  )}

                  {cancellationRejected && sub.cancellationRejectionReason && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#3B82F6', fontWeight: 600 }}>
                      <strong>Cancellation Rejected:</strong> {sub.cancellationRejectionReason}
                    </div>
                  )}

                  {showRenewButton && (
                    <div style={{ marginTop: '1rem' }}>
                      <button
                        onClick={() => handleRenewalRequest(sub._id)}
                        disabled={requestStatus[sub._id] === 'pending'}
                        style={{
                          background: '#2ECC71',
                          color: '#181A20',
                          border: 'none',
                          borderRadius: '0.5rem',
                          padding: '0.7rem 1.2rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {requestStatus[sub._id] === 'pending' ? 'Requesting...' : 'Request Renewal'}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyPurchases; 