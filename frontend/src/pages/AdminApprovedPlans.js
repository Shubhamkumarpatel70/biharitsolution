import React, { useState, useEffect } from 'react';
import axios from '../axios';

const planDisplayNames = {
  starter: 'Starter',
  premium: 'Premium',
  pro: 'Pro',
};

const AdminApprovedPlans = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, [filterStatus, searchQuery]);

  const fetchPlans = async () => {
    try {
      const res = await axios.get('/api/auth/plans');
      setPlans(res.data.plans || res.data || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      const res = await axios.get(`/api/auth/admin/approved-subscriptions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(res.data.subscriptions);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
      setError('Could not fetch approved subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  const money = (value) => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

  const getPaidAmount = (sub) => {
    const confirmedEntries = Array.isArray(sub.paymentEntries)
      ? sub.paymentEntries.filter(entry => entry.status === 'confirmed').reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
      : 0;
    return confirmedEntries > 0 ? confirmedEntries : Number(sub.amountPaid || 0);
  };

  const getPayableAmount = (sub) => Math.max(0, Number(sub.totalAmount || 0) - Number(sub.discountAmount || 0));
  const getDisplayStatus = (sub) => {
    if (sub.canceled || sub.cancellationStatus === 'approved') return 'cancelled';
    if (sub.status === 'expired' || (sub.expiresAt && new Date(sub.expiresAt).getTime() <= Date.now())) return 'expired';
    return sub.status;
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

  const calculateTotalRevenue = () => subscriptions.reduce((sum, sub) => sum + getPaidAmount(sub), 0);

  return (
    <div className="admin-redesign-page max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-success-500">Approved Plans</h2>
        {subscriptions.length > 0 && (
          <div className="bg-success-500/20 border border-success-500/50 rounded-xl px-6 py-3">
            <p className="text-sm text-gray-300 mb-1">Total Revenue from Approved Plans</p>
            <p className="text-2xl font-bold text-success-500">
              ₹{calculateTotalRevenue().toLocaleString('en-IN')}
            </p>
          </div>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-success-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Subscription ID or Transaction ID..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-success-500"
            />
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-success-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-danger-500 text-center py-8">{error}</div>
        ) : subscriptions.length === 0 ? (
          <div className="text-gray-400 text-center py-12">No approved subscriptions found.</div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((sub) => (
              <div key={sub._id} className="bg-gray-700 rounded-xl p-6 border border-gray-600 hover:border-success-500/50 transition-colors">
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
                        {sub.planName || planDisplayNames[sub.plan] || sub.plan}
                      </span>
                      <span className="text-success-500 ml-2 font-semibold">
                        ({money(sub.totalAmount || 0)})
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Subscription ID:</span>
                      <span className="text-success-500 ml-2 font-mono text-sm break-all">{sub.uniqueId || sub._id}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Original plan price:</span>
                      <span className="text-white ml-2 font-semibold">{money(sub.totalAmount)}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Coupon:</span>
                      <span className="text-white ml-2 font-semibold break-all">{sub.couponCode || 'No coupon'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Discount:</span>
                      <span className="text-emerald-400 ml-2 font-semibold">{money(sub.discountAmount)}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Payable after discount:</span>
                      <span className="text-white ml-2 font-semibold">{money(getPayableAmount(sub))}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Amount received:</span>
                      <span className="text-emerald-400 ml-2 font-semibold">{money(getPaidAmount(sub))}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
                        getDisplayStatus(sub) === 'active' ? 'text-green-700 bg-green-100' :
                        getDisplayStatus(sub) === 'cancelled' ? 'text-amber-800 bg-amber-100' :
                        'text-red-700 bg-red-100'
                      }`}>
                        {getDisplayStatus(sub) === 'cancelled' ? '✖ Cancelled' :
                          getDisplayStatus(sub) === 'expired' ? '⏰ Expired' :
                          getDisplayStatus(sub) === 'active' ? '✅ Active' : (sub.status || 'Unknown')}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Transaction ID:</span>
                      <span className="text-success-500 ml-2 font-mono text-sm break-all">{sub.transactionId || sub.cashfreeOrderId || 'Not available'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Payment Method:</span>
                      <span className="text-white ml-2 font-medium">
                        {sub.paymentMethod ? sub.paymentMethod.toUpperCase() : '—'} · {sub.paymentStatus || sub.status || '—'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Approved/Activated:</span>
                      <span className="text-gray-300 ml-2 text-sm">
                        {formatDate(sub.updatedAt)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApprovedPlans;

