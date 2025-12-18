import React, { useState, useEffect } from 'react';
import axios from '../axios';

const planDisplayNames = {
  starter: 'Starter',
  premium: 'Premium',
  pro: 'Pro',
};

const AdminCancellations = () => {
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchCancellations();
  }, [filterStatus]);

  const fetchCancellations = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const queryString = params.toString();
      const url = `/api/auth/admin/cancellations${queryString ? `?${queryString}` : ''}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCancellations(res.data.cancellations || []);
    } catch (err) {
      console.error('Error fetching cancellations:', err);
      setError('Could not fetch subscription cancellations.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/approve-cancellation/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Cancellation approved successfully! Subscription is now inactive.');
      fetchCancellations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve cancellation.');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      setError('Please enter a rejection reason.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/reject-cancellation/${id}`, { reason: rejectReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Cancellation rejected successfully!');
      setRejectingId(null);
      setRejectReason('');
      fetchCancellations();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject cancellation.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl md:text-3xl font-bold text-success-500 mb-6">Subscription Cancellations</h2>
      
      {/* Filter */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <label className="text-sm font-medium text-gray-300">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-success-500"
          >
            <option value="all">All Cancellations</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}

      {/* Cancellations List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-success-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-danger-500 text-center py-8">{error}</div>
        ) : cancellations.length === 0 ? (
          <div className="text-gray-400 text-center py-12">No subscription cancellations found.</div>
        ) : (
          <div className="space-y-4">
            {cancellations.map((sub) => {
              const isPending = sub.cancellationStatus === 'pending';
              const isApproved = sub.cancellationStatus === 'approved';
              const isRejected = sub.cancellationStatus === 'rejected';
              
              return (
              <div key={sub._id} className="bg-gray-700 rounded-xl p-6 border border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">User:</span>
                      <span className="text-white ml-2 font-medium">
                        {sub.user?.name} ({sub.user?.email})
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Plan:</span>
                      <span className="text-white ml-2 font-medium">
                        {planDisplayNames[sub.plan] || sub.plan}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Subscription ID:</span>
                      <span className="text-success-500 ml-2 font-mono text-sm">{sub.uniqueId}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Subscription Status:</span>
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        sub.status === 'active' 
                          ? 'text-green-600 bg-green-100' 
                          : sub.status === 'expired'
                          ? 'text-red-600 bg-red-100'
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Cancellation Status:</span>
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        isPending 
                          ? 'text-yellow-600 bg-yellow-100' 
                          : isApproved
                          ? 'text-red-600 bg-red-100'
                          : isRejected
                          ? 'text-blue-600 bg-blue-100'
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        {isPending ? '⏳ Pending' : isApproved ? '✅ Approved' : isRejected ? '❌ Rejected' : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    {sub.transactionId && (
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Transaction ID:</span>
                        <span className="text-success-500 ml-2 font-mono text-sm">{sub.transactionId}</span>
                      </div>
                    )}
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Payment Method:</span>
                      <span className="text-white ml-2 font-medium">
                        {sub.paymentMethod ? sub.paymentMethod.toUpperCase() : 'UPI'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Cancellation Request Date:</span>
                      <span className="text-gray-300 ml-2 text-sm">
                        {formatDate(sub.cancellationRequestDate)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Expires At:</span>
                      <span className="text-gray-300 ml-2 text-sm">
                        {formatDate(sub.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cancellation Reason */}
                <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400 font-semibold text-sm">⚠️ Cancellation Reason:</span>
                  </div>
                  <p className="text-red-200 mt-2 whitespace-pre-wrap">{sub.cancellationReason || 'No reason provided.'}</p>
                </div>

                {/* Payment Image if available */}
                {sub.paymentImage && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm font-medium">Payment Screenshot/Receipt:</span>
                      <button
                        onClick={() => {
                          const imageUrl = sub.paymentImage.startsWith('data:') 
                            ? sub.paymentImage 
                            : sub.paymentImage.startsWith('http') 
                            ? sub.paymentImage 
                            : `${axios.defaults.baseURL || ''}${sub.paymentImage}`;
                          window.open(imageUrl, '_blank');
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 transform hover:shadow-lg"
                      >
                        📷 View Image
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons for Pending Cancellations */}
                {isPending ? (
                  rejectingId === sub._id ? (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason"
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-danger-500"
                      />
                      <button 
                        onClick={() => handleReject(sub._id)} 
                        className="px-6 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform"
                      >
                        Submit Reject
                      </button>
                      <button 
                        onClick={() => { setRejectingId(null); setRejectReason(''); }} 
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 flex gap-3">
                      <button 
                        onClick={() => handleApprove(sub._id)} 
                        className="px-6 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform hover:shadow-lg"
                      >
                        ✅ Approve Cancellation
                      </button>
                      <button 
                        onClick={() => setRejectingId(sub._id)} 
                        className="px-6 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 transform hover:shadow-lg"
                      >
                        ❌ Reject Cancellation
                      </button>
                    </div>
                  )
                ) : isApproved ? (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                    <p className="text-red-200 text-sm">
                      ✅ Cancellation approved on {formatDate(sub.cancellationApprovedDate)}. Subscription is now inactive.
                    </p>
                  </div>
                ) : isRejected && sub.cancellationRejectionReason ? (
                  <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      <strong>Rejection Reason:</strong> {sub.cancellationRejectionReason}
                    </p>
                  </div>
                ) : null}
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCancellations;

