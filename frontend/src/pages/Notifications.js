import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Link } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/user-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      setError('Could not fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/auth/notifications/read/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      setError('Could not mark notification as read.');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { setError('Could not mark all notifications as read.'); }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center p-8">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-600">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl sm:text-3xl font-bold text-primary-900">
        Notifications {unreadCount > 0 && <span className="bg-red-500 text-white rounded-full px-3 py-1 text-sm ml-2">{unreadCount}</span>}
      </h2>{unreadCount > 0 && <button onClick={markAllAsRead} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Mark all as read</button>}</div>
      
      {error && (
        <div className="text-red-700 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          <div className="text-5xl mb-3">🔔</div>
          <h3 className="text-slate-800 font-semibold mb-1">No notifications yet</h3>
          <p>You will see important updates and announcements here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notifications.map(notification => (
            <div 
              key={notification._id} 
              className={`relative rounded-xl p-4 sm:p-5 border shadow-sm ${
                notification.read
                  ? 'bg-white border-slate-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              {!notification.read && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full"></div>
              )}

              <div className="flex gap-3 items-start">
                <div className="text-2xl mt-0.5">{notification.type === 'agreement' ? '📄' : notification.type === 'subscription' ? '⏳' : notification.type === 'project' ? '🛠️' : '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-base sm:text-lg mb-1 ${notification.read ? 'text-slate-800' : 'text-emerald-700'}`}>
                    {notification.title || 'Notification'}
                  </div>
                  <div className={`mb-3 leading-relaxed text-sm sm:text-base ${notification.read ? 'text-slate-600' : 'text-slate-800'}`}>
                    {notification.message}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="text-xs sm:text-sm text-slate-500">
                      {new Date(notification.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {notification.link && <Link to={notification.link} className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">View details</Link>}
                      {!notification.read && <button onClick={() => markAsRead(notification._id)} className="rounded-lg border border-emerald-400 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Mark as read</button>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
