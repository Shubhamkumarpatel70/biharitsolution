import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import axios from '../axios';
import { Icon } from '../components/icons';

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
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" aria-hidden />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            Welcome back,{' '}
            <span className="text-accent-400">{user?.name || 'User'}</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-xl">
            Subscriptions, messages, and support requests—organized in one calm view.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center text-amber-900 shrink-0">
              <Icon name="user" className="w-8 h-8" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{user?.name || 'User'}</h2>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-slate-600">
                <span className="break-all">{user?.email || 'N/A'}</span>
                <span className="text-slate-400" aria-hidden>•</span>
                <span>{user?.role || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Link to="/dashboard/subscription" className="flex flex-col items-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors min-w-0">
            <span className="inline-flex p-2 rounded-lg bg-amber-50 text-amber-900 mb-2">
              <Icon name="creditCard" className="w-6 h-6" strokeWidth={2} />
            </span>
            <span className="text-sm font-medium text-slate-800 text-center leading-tight break-words max-w-full px-0.5">Manage plan</span>
          </Link>
          <Link to="/dashboard/purchases" className="flex flex-col items-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors min-w-0">
            <span className="inline-flex p-2 rounded-lg bg-sky-50 text-sky-800 mb-2">
              <Icon name="cart" className="w-6 h-6" strokeWidth={2} />
            </span>
            <span className="text-sm font-medium text-slate-800 text-center leading-tight break-words max-w-full px-0.5">Purchases</span>
          </Link>
          <Link to="/dashboard/notifications" className="flex flex-col items-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors min-w-0">
            <span className="inline-flex p-2 rounded-lg bg-violet-50 text-violet-800 mb-2">
              <Icon name="bell" className="w-6 h-6" strokeWidth={2} />
            </span>
            <span className="text-sm font-medium text-slate-800 text-center leading-tight break-words max-w-full px-0.5">Notifications</span>
          </Link>
          <Link to="/dashboard/support" className="flex flex-col items-center p-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors min-w-0">
            <span className="inline-flex p-2 rounded-lg bg-emerald-50 text-emerald-800 mb-2">
              <Icon name="chat" className="w-6 h-6" strokeWidth={2} />
            </span>
            <span className="text-sm font-medium text-slate-800 text-center leading-tight break-words max-w-full px-0.5">Support</span>
          </Link>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-primary-800 border border-slate-200">
              <Icon name="user" className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Your role</h3>
              <p className="text-lg font-bold text-slate-900">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-900 border border-amber-100">
              <Icon name="mail" className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Email</h3>
              <p className="text-lg font-bold text-slate-900 truncate">{user?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-800 border border-sky-100">
              <Icon name="clock" className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-1">Member since</h3>
              <p className="text-lg font-bold text-slate-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Widget */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Current plan</h2>
            <span className="inline-flex p-2 rounded-lg bg-amber-50 text-amber-900">
              <Icon name="creditCard" className="w-5 h-5" strokeWidth={2} />
            </span>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent notifications</h2>
            <span className="inline-flex p-2 rounded-lg bg-violet-50 text-violet-800">
              <Icon name="bell" className="w-5 h-5" strokeWidth={2} />
            </span>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Your complaints</h2>
          <span className="inline-flex p-2 rounded-lg bg-slate-100 text-slate-800">
            <Icon name="document" className="w-5 h-5" strokeWidth={2} />
          </span>
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

      {/* Quick actions — wide tiles on small screens to prevent label overlap */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 sm:mb-6">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/dashboard/subscription"
            className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-amber-400/70 hover:bg-amber-50/40 transition-all duration-200 group min-w-0"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-[1.03] transition-transform text-amber-900 border border-amber-100 shrink-0">
              <Icon name="creditCard" className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 w-full px-1 leading-snug break-words">Subscription</h3>
            <p className="text-xs text-slate-500 leading-snug px-1">Manage your plan</p>
          </Link>
          <Link
            to="/dashboard/purchases"
            className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-sky-400/70 hover:bg-sky-50/40 transition-all duration-200 group min-w-0"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-sky-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-[1.03] transition-transform text-sky-800 border border-sky-100 shrink-0">
              <Icon name="cart" className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 w-full px-1 leading-snug break-words">My purchases</h3>
            <p className="text-xs text-slate-500 leading-snug px-1">Order history</p>
          </Link>
          <Link
            to="/dashboard/support"
            className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-400/70 hover:bg-emerald-50/40 transition-all duration-200 group min-w-0"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-[1.03] transition-transform text-emerald-800 border border-emerald-100 shrink-0">
              <Icon name="chat" className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 w-full px-1 leading-snug break-words">Support</h3>
            <p className="text-xs text-slate-500 leading-snug px-1">Get help</p>
          </Link>
          <Link
            to="/plans"
            className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border border-slate-200 bg-white hover:border-violet-400/70 hover:bg-violet-50/40 transition-all duration-200 group min-w-0"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-50 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-[1.03] transition-transform text-violet-800 border border-violet-100 shrink-0">
              <Icon name="clipboard" className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1 w-full px-1 leading-snug break-words">Browse plans</h3>
            <p className="text-xs text-slate-500 leading-snug px-1">See pricing</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
