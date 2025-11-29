import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from '../axios';

const planDisplayNames = {
  starter: 'Starter',
  premium: 'Premium',
  pro: 'Pro',
};

const DashboardHome = () => {
  const { user } = useOutletContext();
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [complaintsError, setComplaintsError] = useState('');

  useEffect(() => {
    const fetchSubs = async () => {
      setSubsLoading(true);
      setSubsError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/user-subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubs(res.data.subscriptions || []);
      } catch (err) {
        setSubsError('Could not fetch subscription info.');
      }
      setSubsLoading(false);
    };
    const fetchNotifs = async () => {
      setNotifLoading(true);
      setNotifError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/user-notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setNotifError('Could not fetch notifications.');
      }
      setNotifLoading(false);
    };
    const fetchComplaints = async () => {
      setComplaintsLoading(true);
      setComplaintsError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/complaints', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setComplaints(res.data.complaints || []);
      } catch (err) {
        setComplaintsError('Could not fetch complaints.');
      }
      setComplaintsLoading(false);
    };
    fetchSubs();
    fetchNotifs();
    fetchComplaints();
  }, []);

  let current = null;
  if (subs.length > 0) {
    current = subs.find(s => s.status === 'active' || s.status === 'pending') || subs[0];
  }
  const daysLeft = current && current.expiresAt ? Math.ceil((new Date(current.expiresAt) - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const isExpired = current && current.expiresAt && new Date(current.expiresAt) < new Date();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Welcome Header */}
      <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          Welcome back, <span className="text-accent-500">{user?.name || 'User'}</span>!
        </h1>
        <p className="text-white/90 text-sm md:text-base">
          Here's an overview of your account and recent activity
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center text-2xl font-black text-primary-900">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-600 mb-1">{user?.name || 'User'}</h2>
              <div className="flex flex-wrap gap-2 text-sm text-text-muted">
                <span>{user?.email || 'N/A'}</span>
                <span>•</span>
                <span>{user?.role || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to="/dashboard/subscription" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-light transition-colors">
            <span className="text-2xl mb-2">💳</span>
            <span className="text-sm font-medium text-text-main">Manage Plan</span>
          </Link>
          <Link to="/dashboard/purchases" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-light transition-colors">
            <span className="text-2xl mb-2">🛒</span>
            <span className="text-sm font-medium text-text-main">Purchases</span>
          </Link>
          <Link to="/dashboard/notifications" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-light transition-colors">
            <span className="text-2xl mb-2">🔔</span>
            <span className="text-sm font-medium text-text-main">Notifications</span>
          </Link>
          <Link to="/dashboard/support" className="flex flex-col items-center p-4 rounded-xl hover:bg-gray-light transition-colors">
            <span className="text-2xl mb-2">💬</span>
            <span className="text-sm font-medium text-text-main">Support</span>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-1">Your Role</h3>
              <p className="text-lg font-bold text-text-main">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-500/10 rounded-xl flex items-center justify-center text-2xl">
              📧
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-1">Email</h3>
              <p className="text-lg font-bold text-text-main truncate">{user?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-500/10 rounded-xl flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-muted mb-1">Member Since</h3>
              <p className="text-lg font-bold text-text-main">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Widget */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary-600">Current Plan</h2>
            <span className="text-2xl">💳</span>
          </div>
          <div className="p-6">
            {subsLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-muted">Loading subscription...</p>
              </div>
            ) : subsError ? (
              <div className="text-center py-8 text-danger-500">{subsError}</div>
            ) : !current ? (
              <div className="text-center py-8">
                <p className="text-text-muted mb-4">No active plan</p>
                <Link to="/plans" className="btn btn-primary inline-block">
                  Choose a Plan
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {planDisplayNames[current.plan] || current.plan}
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      current.status === 'active' 
                        ? 'bg-success-500/20 text-success-600' 
                        : current.status === 'pending'
                        ? 'bg-warning-500/20 text-warning-600'
                        : 'bg-danger-500/20 text-danger-600'
                    }`}>
                      {current.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Expires:</span>
                    <span className="font-medium text-text-main">
                      {current.expiresAt ? new Date(current.expiresAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {daysLeft !== null && !isExpired && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Days left:</span>
                      <span className="font-bold text-accent-500">{daysLeft}</span>
                    </div>
                  )}
                  {isExpired && (
                    <div className="text-center py-2 bg-danger-500/10 text-danger-600 rounded-lg text-sm font-semibold">
                      Plan Expired
                    </div>
                  )}
                </div>
                <Link to="/dashboard/subscription" className="block text-center py-2 text-accent-500 hover:text-accent-600 font-semibold transition-colors">
                  Manage Plan →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Notifications Widget */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary-600">Recent Notifications</h2>
            <span className="text-2xl">🔔</span>
          </div>
          <div className="p-6">
            {notifLoading ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-muted">Loading notifications...</p>
              </div>
            ) : notifError ? (
              <div className="text-center py-8 text-danger-500">{notifError}</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No notifications</div>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 3).map(n => (
                  <div key={n._id} className={`p-4 rounded-xl border ${
                    n.read ? 'bg-gray-light border-gray-200' : 'bg-accent-500/5 border-accent-500/20'
                  }`}>
                    <div className="flex items-start gap-3">
                      {!n.read && <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0"></div>}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-text-main mb-1">{n.title || 'Notification'}</h4>
                        <p className="text-sm text-text-muted mb-2">{n.message}</p>
                        <span className="text-xs text-text-muted">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/dashboard/notifications" className="block text-center py-2 text-accent-500 hover:text-accent-600 font-semibold transition-colors">
                  View All →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaints Widget */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary-600">Your Complaints</h2>
          <span className="text-2xl">📝</span>
        </div>
        <div className="p-6">
          {complaintsLoading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-muted">Loading complaints...</p>
            </div>
          ) : complaintsError ? (
            <div className="text-center py-8 text-danger-500">{complaintsError}</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8 text-text-muted">No complaints raised yet.</div>
          ) : (
            <div className="space-y-4">
              {complaints.map(c => (
                <div key={c._id} className="p-4 rounded-xl border border-gray-200 bg-gray-light">
                  <div className="space-y-2">
                    <div><b className="text-text-main">Issue:</b> <span className="text-text-muted">{c.message}</span></div>
                    <div className="flex items-center gap-2">
                      <b className="text-text-main">Status:</b>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.status === 'resolved' 
                          ? 'bg-success-500/20 text-success-600' 
                          : 'bg-warning-500/20 text-warning-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {(c._id && (c.status === 'open' || c.reopenStatus === 'accepted')) && (
                        <Link 
                          to={`/support-chat/${c._id}`}
                          className="px-4 py-2 bg-accent-500 text-white rounded-lg text-sm font-semibold hover:bg-accent-600 transition-colors"
                        >
                          Continue Chat
                        </Link>
                      )}
                      {c.status === 'resolved' && c.reopenStatus !== 'pending' && c.reopenStatus !== 'accepted' && (
                        <button 
                          onClick={async () => {
                            const token = localStorage.getItem('token');
                            await axios.post(`/api/auth/complaints/${c._id}/reopen`, {}, { headers: { Authorization: `Bearer ${token}` } });
                            setComplaints(complaints => complaints.map(cc => cc._id === c._id ? { ...cc, reopenStatus: 'pending' } : cc));
                          }}
                          className="px-4 py-2 bg-warning-500 text-white rounded-lg text-sm font-semibold hover:bg-warning-600 transition-colors"
                        >
                          Reopen Chat
                        </button>
                      )}
                      {c.reopenStatus === 'pending' && (
                        <span className="px-3 py-1 bg-warning-500/20 text-warning-600 rounded-lg text-xs font-semibold">
                          Reopen requested (awaiting admin)
                        </span>
                      )}
                      {c.reopenStatus === 'rejected' && (
                        <span className="px-3 py-1 bg-danger-500/20 text-danger-600 rounded-lg text-xs font-semibold">
                          Reopen rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <h2 className="text-xl font-bold text-primary-600 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/dashboard/subscription" className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-accent-500 hover:bg-accent-500/5 transition-all duration-200 group">
            <div className="w-14 h-14 bg-accent-500/10 rounded-xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              💳
            </div>
            <h3 className="font-semibold text-text-main mb-1">Subscription</h3>
            <p className="text-xs text-text-muted text-center">Manage your plan</p>
          </Link>
          <Link to="/dashboard/purchases" className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-accent-500 hover:bg-accent-500/5 transition-all duration-200 group">
            <div className="w-14 h-14 bg-accent-500/10 rounded-xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              🛒
            </div>
            <h3 className="font-semibold text-text-main mb-1">My Purchases</h3>
            <p className="text-xs text-text-muted text-center">View order history</p>
          </Link>
          <Link to="/dashboard/support" className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-accent-500 hover:bg-accent-500/5 transition-all duration-200 group">
            <div className="w-14 h-14 bg-accent-500/10 rounded-xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              💬
            </div>
            <h3 className="font-semibold text-text-main mb-1">Support</h3>
            <p className="text-xs text-text-muted text-center">Get help</p>
          </Link>
          <Link to="/plans" className="flex flex-col items-center p-6 rounded-xl border border-gray-200 hover:border-accent-500 hover:bg-accent-500/5 transition-all duration-200 group">
            <div className="w-14 h-14 bg-accent-500/10 rounded-xl flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
              📋
            </div>
            <h3 className="font-semibold text-text-main mb-1">Browse Plans</h3>
            <p className="text-xs text-text-muted text-center">Explore services</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
