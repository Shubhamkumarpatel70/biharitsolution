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
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-primary-900 mb-4">My Purchases</h2>
      {error && <div className="text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">Loading...</div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">No purchases found.</div>
        ) : (
          <ul className="list-none p-0 space-y-4">
            {subscriptions.map((sub) => {
              const isExpired = sub.status === 'expired';
              const isRenewalPending = sub.renewalStatus === 'pending';
              const cancellationPending = sub.cancellationStatus === 'pending';
              const cancellationApproved = sub.cancellationStatus === 'approved';
              const cancellationRejected = sub.cancellationStatus === 'rejected';
              const showRenewButton = isExpired && !isRenewalPending && !cancellationApproved;

              return (
                <li key={sub._id} className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="text-slate-800 text-sm sm:text-base space-y-1">
                      <div><b>Plan:</b> {sub.planName || planDisplayNames[sub.plan] || sub.plan || '—'}</div>
                      <div className="break-all"><b>Subscription ID:</b> <span className="font-mono text-xs">{sub.uniqueId || sub._id}</span></div>
                      <div><b>Plan price:</b> ₹{Number(sub.totalAmount || 0).toLocaleString('en-IN')}</div>
                      {sub.couponCode && <div><b>Coupon:</b> <span className="font-semibold text-emerald-700">{sub.couponCode}</span></div>}
                      {Number(sub.discountAmount || 0) > 0 && <div><b>Coupon discount:</b> <span className="font-semibold text-emerald-700">−₹{Number(sub.discountAmount).toLocaleString('en-IN')}</span></div>}
                      <div><b>Payable amount:</b> ₹{Number(sub.amountPaid ?? Math.max(0, Number(sub.totalAmount || 0) - Number(sub.discountAmount || 0))).toLocaleString('en-IN')}</div>
                      <div className="break-all"><b>Transaction ID:</b> <span className="font-mono text-xs">{sub.transactionId || sub.cashfreeOrderId || 'Pending'}</span></div>
                      <div><b>Payment status:</b> <span className="capitalize">{sub.paymentStatus || '—'}</span></div>
                      {(sub.cancellationStatus && sub.cancellationStatus !== 'none' || sub.canceled) && <div><b>Refund status:</b> <span className="font-semibold capitalize">{{ not_reviewed: 'Awaiting review', not_eligible: 'Not eligible', approved: 'Approved · payout pending', rejected: 'Rejected', processed: 'Processed' }[sub.refundStatus || 'not_reviewed'] || 'Awaiting review'}</span>{Number(sub.refundAmount || 0) > 0 ? ' · ₹' + Number(sub.refundAmount).toLocaleString('en-IN') : ''}</div>}
                      {sub.cancellationInitiatedBy && <div><b>Cancelled by:</b> {sub.cancellationInitiatedBy === 'askc' ? 'ASKC TECHNOLOGIES' : sub.cancellationInitiatedBy === 'user' ? 'You (self)' : 'System'}</div>}
                      <div><b>Status:</b> <span className={`font-bold ${sub.status === 'active' ? 'text-emerald-600' : 'text-orange-600'}`}>{sub.status}</span></div>
                      {cancellationApproved && (
                        <div style={{ color: '#FF6B35', fontWeight: 700, fontSize: '1rem', marginTop: '0.5rem' }}>
                          ❌ Plan Cancelled
                        </div>
                      )}
                      {sub.expiresAt && <div className="text-sm text-slate-500">Expires: {new Date(sub.expiresAt).toLocaleDateString()}</div>}
                    </div>
                    {isExpired && !isRenewalPending && !cancellationApproved && (
                      <span className="bg-orange-500 text-white rounded-full px-3 py-1 font-bold text-xs sm:text-sm">Expired</span>
                    )}
                    {cancellationApproved && (
                      <span className="bg-orange-500 text-white rounded-full px-3 py-1 font-bold text-xs sm:text-sm">Cancelled</span>
                    )}
                  </div>

                  {isRenewalPending && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-800 font-semibold text-sm">
                      Renewal request is pending approval from admin.
                    </div>
                  )}
                  
                  {sub.renewalStatus === 'rejected' && (
                     <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 font-semibold text-sm">
                       <strong>Renewal Rejected:</strong> {sub.renewalRejectionReason}
                     </div>
                  )}

                  {cancellationPending && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-yellow-800 font-semibold text-sm">
                      ⏳ Cancellation request is pending approval from admin.
                    </div>
                  )}

                  {cancellationApproved && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg text-orange-700 font-semibold text-sm">
                      ❌ Plan Cancelled - Your subscription has been cancelled and is now inactive.
                    </div>
                  )}

                  {cancellationRejected && sub.cancellationRejectionReason && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-700 font-semibold text-sm">
                      <strong>Cancellation Rejected:</strong> {sub.cancellationRejectionReason}
                    </div>
                  )}

                  {showRenewButton && (
                    <div className="mt-3">
                      <button
                        onClick={() => handleRenewalRequest(sub._id)}
                        disabled={requestStatus[sub._id] === 'pending'}
                        className="bg-primary-600 text-white rounded-lg px-4 py-2.5 font-semibold text-sm hover:bg-primary-700 disabled:opacity-50"
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