import React, { useEffect, useState } from 'react';
import axios from '../axios';

const planDisplayNames = {
  starter: 'Starter',
  premium: 'Premium',
  pro: 'Pro',
};

const AdminApprove = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingImage, setViewingImage] = useState(null);

  const fetchSubs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/admin/pending-subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubs(res.data.subscriptions);
    } catch (err) {
      setError('Could not fetch subscriptions.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubs(); }, []);

  const handleApprove = async (id) => {
    setActionMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/approve-subscription/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('Subscription approved!');
      fetchSubs();
    } catch {
      setActionMsg('Could not approve.');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      setActionMsg('Please enter a rejection reason.');
      return;
    }
    setActionMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/reject-subscription/${id}`, { reason: rejectReason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMsg('Subscription rejected!');
      setRejectingId(null);
      setRejectReason('');
      fetchSubs();
    } catch {
      setActionMsg('Could not reject.');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${axios.defaults.baseURL || ''}${imagePath}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl md:text-3xl font-bold text-success-500 mb-6">Approve Subscriptions</h2>
      
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-success-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-danger-500 text-center py-8">{error}</div>
        ) : subs.length === 0 ? (
          <div className="text-gray-400 text-center py-12">No pending subscriptions.</div>
        ) : (
          <div className="space-y-4">
            {subs.map(sub => {
              const imageUrl = getImageUrl(sub.paymentImage);
              return (
                <div key={sub._id} className="bg-gray-700 rounded-xl p-6 border border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">User:</span>
                        <span className="text-white ml-2 font-medium">{sub.user?.name} ({sub.user?.email})</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Plan:</span>
                        <span className="text-white ml-2 font-medium">{planDisplayNames[sub.plan] || sub.plan}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Subscription ID:</span>
                        <span className="text-success-500 ml-2 font-mono text-sm">{sub.uniqueId}</span>
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
                        <span className="text-white ml-2 font-medium">{sub.paymentMethod ? sub.paymentMethod.toUpperCase() : 'UPI'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Requested:</span>
                        <span className="text-gray-300 ml-2 text-sm">{new Date(sub.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Image Section */}
                  {imageUrl && (
                    <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm font-medium">Payment Screenshot/Receipt:</span>
                        <button
                          onClick={() => setViewingImage(imageUrl)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          View Image
                        </button>
                      </div>
                      <div className="mt-2">
                        <img 
                          src={imageUrl} 
                          alt="Payment receipt" 
                          className="max-w-xs h-32 object-contain bg-gray-900 rounded-lg border border-gray-600 p-2"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden text-gray-500 text-sm">Image failed to load</div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {rejectingId === sub._id ? (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Enter rejection reason"
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-danger-500"
                      />
                      <button 
                        onClick={() => handleReject(sub._id)} 
                        className="px-6 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        Submit
                      </button>
                      <button 
                        onClick={() => { setRejectingId(null); setRejectReason(''); }} 
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 mt-4">
                      <button 
                        onClick={() => handleApprove(sub._id)} 
                        className="px-6 py-2 bg-success-500 hover:bg-success-600 text-gray-900 rounded-lg font-semibold transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => setRejectingId(sub._id)} 
                        className="px-6 py-2 bg-danger-500 hover:bg-danger-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {actionMsg && (
          <div className={`mt-4 text-center font-semibold ${actionMsg.includes('approve') ? 'text-success-500' : 'text-danger-500'}`}>
            {actionMsg}
          </div>
        )}
      </div>

      {/* Image View Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-gray-800 rounded-xl p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <img 
              src={viewingImage} 
              alt="Payment receipt full view" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden text-center text-gray-400 py-8">Image failed to load</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprove;
