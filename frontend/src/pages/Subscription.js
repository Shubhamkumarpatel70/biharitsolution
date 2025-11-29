import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate, Link } from 'react-router-dom';

const planDisplayNames = {
  starter: 'Starter',
  premium: 'Premium',
  pro: 'Pro',
};

const Subscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);
  const navigate = useNavigate();

  const fetchSubscription = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/user-subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subscriptions = res.data.subscriptions || [];
      const activeSub = subscriptions.find((s) => s.status === 'active');
      const latestSub = subscriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      setSubscription(activeSub || latestSub || null);
    } catch (err) {
      setError('Could not fetch subscription details.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, []);


  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      setError('Please provide a reason for cancellation.');
      return;
    }
    
    setCanceling(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/auth/cancel-subscription/${subscription._id}`,
        { reason: cancelReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCancelModal(false);
      setCancelReason('');
      fetchSubscription();
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Could not cancel subscription.';
      setError(errorMessage);
    } finally {
      setCanceling(false);
    }
  };

  const isExpired = subscription && subscription.status === 'expired';
  const canCancel = subscription && subscription.status === 'active' && 
    subscription.cancellationStatus !== 'pending' && 
    subscription.cancellationStatus !== 'approved';
  const cancellationPending = subscription && subscription.cancellationStatus === 'pending';
  const cancellationApproved = subscription && subscription.cancellationStatus === 'approved';
  const cancellationRejected = subscription && subscription.cancellationStatus === 'rejected';
  // Show Buy New Plan button if subscription is cancelled, expired, or user has no active subscription
  const showBuyNewPlan = cancellationApproved || isExpired || !subscription || subscription.status !== 'active';

  if (loading) {
    return <div style={{ color: '#E5E7EB', textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', color: '#E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', margin: 0 }}>My Subscription</h2>
        {isExpired && !cancellationPending && <span style={{ background: '#FF6B35', color: '#fff', borderRadius: '0.7rem', padding: '0.3rem 1.1rem', fontWeight: 700, fontSize: '1rem' }}>Expired</span>}
        {cancellationApproved && <span style={{ background: '#FF6B35', color: '#fff', borderRadius: '0.7rem', padding: '0.3rem 1.1rem', fontWeight: 700, fontSize: '1rem' }}>Cancelled</span>}
      </div>

      {error && <div style={{ color: '#FF6B35', background: 'rgba(255, 107, 53, 0.1)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}
      
      {!subscription && !error ? (
        <div style={{ color: '#A0AEC0', textAlign: 'center', background: '#23272F', padding: '2rem', borderRadius: '1rem' }}>No subscription found.</div>
      ) : subscription && (
        <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <div style={{ marginBottom: '1rem' }}><b>Current Plan:</b> {planDisplayNames[subscription.plan]}</div>
          <div style={{ marginBottom: '1rem' }}><b>Status:</b> <span style={{ color: subscription.status === 'active' ? '#2ECC71' : '#FF6B35', fontWeight: 700, marginLeft: '0.5rem' }}>{subscription.status}</span></div>
          <div style={{ marginBottom: '1rem' }}><b>Expires At:</b> {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}</div>
          
          {cancellationPending && (
            <div style={{ background: 'rgba(255, 165, 0, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#FFA500', fontWeight: 600, marginTop: '1rem' }}>
              ⏳ Cancellation request is pending approval from admin.
            </div>
          )}

          {cancellationApproved && (
            <div style={{ background: 'rgba(255, 107, 53, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#FF6B35', fontWeight: 700, marginTop: '1rem', fontSize: '1.1rem' }}>
              ❌ Plan Cancelled - Your subscription has been cancelled and is now inactive.
            </div>
          )}

          {cancellationRejected && subscription.cancellationRejectionReason && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '0.5rem', color: '#3B82F6', fontWeight: 600, marginTop: '1rem' }}>
              <strong>Cancellation Rejected:</strong> {subscription.cancellationRejectionReason}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            {canCancel && (
              <button 
                onClick={() => setShowCancelModal(true)} 
                style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}
              >
                Cancel Subscription
              </button>
            )}
            
            {showBuyNewPlan && (
              <Link
                to="/plans"
                style={{ 
                  background: '#2ECC71', 
                  color: '#181A20', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  padding: '0.7rem 1.5rem', 
                  fontWeight: 700, 
                  fontSize: '1rem', 
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#27AE60';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2ECC71';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                📦 Buy New Plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => !canceling && setShowCancelModal(false)}
        >
          <div 
            style={{
              background: '#23272F',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              border: '2px solid #FF6B35'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ color: '#FF6B35', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Cancel Subscription Warning
              </h3>
              <p style={{ color: '#E5E7EB', fontSize: '1rem', lineHeight: '1.6' }}>
                If you cancel your subscription, you will receive only <strong style={{ color: '#FF6B35' }}>50%</strong> of your total amount as a refund.
              </p>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#E5E7EB', marginBottom: '0.5rem', fontWeight: 600 }}>
                Reason for Cancellation <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for canceling your subscription..."
                required
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#181A20',
                  border: '1px solid #3A3F47',
                  borderRadius: '0.5rem',
                  color: '#E5E7EB',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleCancelSubscription}
                disabled={canceling || !cancelReason.trim()}
                style={{
                  flex: 1,
                  background: canceling ? '#666' : '#FF6B35',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: canceling ? 'not-allowed' : 'pointer',
                  opacity: canceling || !cancelReason.trim() ? 0.6 : 1
                }}
              >
                {canceling ? 'Canceling...' : 'Confirm Cancel'}
              </button>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setError('');
                }}
                disabled={canceling}
                style={{
                  flex: 1,
                  background: '#3A3F47',
                  color: '#E5E7EB',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription; 