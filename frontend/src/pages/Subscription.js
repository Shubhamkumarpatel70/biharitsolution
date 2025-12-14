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
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-200 text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-green-500 font-bold text-2xl sm:text-3xl">My Subscription</h2>
        <div className="flex gap-2">
          {isExpired && !cancellationPending && (
            <span className="bg-orange-500 text-white rounded-lg px-3 py-1.5 font-bold text-sm sm:text-base">
              Expired
            </span>
          )}
          {cancellationApproved && (
            <span className="bg-orange-500 text-white rounded-lg px-3 py-1.5 font-bold text-sm sm:text-base">
              Cancelled
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {!subscription && !error ? (
        <div className="text-gray-400 text-center bg-gray-800 p-8 rounded-xl">
          No subscription found.
        </div>
      ) : subscription && (
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-gray-300">Current Plan:</span>
              <span className="text-white text-lg">{planDisplayNames[subscription.plan] || subscription.plan}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-gray-300">Status:</span>
              <span className={`font-bold ${
                subscription.status === 'active' ? 'text-green-500' : 'text-orange-500'
              }`}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="font-semibold text-gray-300">Expires At:</span>
              <span className="text-gray-200">
                {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          
          {cancellationPending && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 p-4 rounded-lg mb-4">
              ⏳ Cancellation request is pending approval from admin.
            </div>
          )}

          {cancellationApproved && (
            <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 p-4 rounded-lg mb-4 font-bold">
              ❌ Plan Cancelled - Your subscription has been cancelled and is now inactive.
            </div>
          )}

          {cancellationRejected && subscription.cancellationRejectionReason && (
            <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 p-4 rounded-lg mb-4">
              <strong>Cancellation Rejected:</strong> {subscription.cancellationRejectionReason}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {canCancel && (
              <button 
                onClick={() => setShowCancelModal(true)} 
                className="bg-orange-500 hover:bg-orange-600 text-white border-none rounded-lg px-6 py-3 font-bold text-base cursor-pointer transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Cancel Subscription
              </button>
            )}
            
            {showBuyNewPlan && (
              <Link
                to="/plans"
                className="bg-green-500 hover:bg-green-600 text-gray-900 border-none rounded-lg px-6 py-3 font-bold text-base cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl text-center no-underline inline-block transform hover:scale-105"
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-4"
          onClick={() => !canceling && setShowCancelModal(false)}
        >
          <div 
            className="bg-gray-800 rounded-xl p-6 sm:p-8 max-w-lg w-full border-2 border-orange-500 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-orange-500 text-xl sm:text-2xl font-bold mb-2">
                Cancel Subscription Warning
              </h3>
              <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                If you cancel your subscription, you will receive only <strong className="text-orange-500">50%</strong> of your total amount as a refund.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-200 mb-2 font-semibold">
                Reason for Cancellation <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for canceling your subscription..."
                required
                rows={4}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCancelSubscription}
                disabled={canceling || !cancelReason.trim()}
                className={`flex-1 rounded-lg py-3 font-bold text-base transition-all ${
                  canceling || !cancelReason.trim()
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer shadow-lg hover:shadow-xl'
                }`}
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
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 border-none rounded-lg py-3 font-bold text-base cursor-pointer transition-colors"
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