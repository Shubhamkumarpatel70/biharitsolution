import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Link } from 'react-router-dom';

function safeNotificationHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const allowed = new Set(['B','STRONG','I','EM','U','P','DIV','BR','SPAN']);
  const clean = node => {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent || '');
    if (node.nodeType !== Node.ELEMENT_NODE || !allowed.has(node.tagName)) {
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes || []).forEach(child => fragment.appendChild(clean(child)));
      return fragment;
    }
    const el = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === 'SPAN') {
      const color = (node.getAttribute('style') || '').match(/color\s*:\s*(#[0-9a-fA-F]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))/);
      if (color) el.style.color = color[1];
    }
    Array.from(node.childNodes).forEach(child => el.appendChild(clean(child)));
    return el;
  };
  const root = document.createElement('div');
  Array.from(doc.body.childNodes).forEach(child => root.appendChild(clean(child)));
  return root.innerHTML;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pushStatus, setPushStatus] = useState('');
  const [pushBusy, setPushBusy] = useState(false);
  const [clockNow, setClockNow] = useState(Date.now());
  const [serverTimeOffset, setServerTimeOffset] = useState(0);

  useEffect(() => { const timer = window.setInterval(() => setClockNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

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
      if (res.data.serverNow) setServerTimeOffset(new Date(res.data.serverNow).getTime() - Date.now());
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
      await axios.post(`/api/auth/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      setError('Could not mark notification as read.');
    }
  };


  const enablePushNotifications = async () => {
    setPushBusy(true); setPushStatus('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setPushStatus('This browser does not support mobile push notifications.'); return;
      }
      const token = localStorage.getItem('token');
      const keyRes = await axios.get('/api/auth/push/public-key', { headers: { Authorization: `Bearer ${token}` } });
      if (!keyRes.data.enabled || !keyRes.data.publicKey) {
        setPushStatus('Push service is not configured on the server yet.'); return;
      }
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') { setPushStatus('Notification permission was not granted.'); return; }
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Uint8Array.from(atob(keyRes.data.publicKey.replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0))
      });
      await axios.post('/api/auth/push/subscribe', { subscription: subscription.toJSON() }, { headers: { Authorization: `Bearer ${token}` } });
      setPushStatus('Push notifications enabled on this device.');
    } catch (err) { setPushStatus(err.response?.data?.message || 'Could not enable push notifications.'); }
    finally { setPushBusy(false); }
  };

  const authoritativeNow = clockNow + serverTimeOffset;
  const visibleNotifications = notifications.filter(n => !n.countdownEndsAt || new Date(n.countdownEndsAt).getTime() > authoritativeNow);
  const countdownText = end => {
    const seconds = Math.max(0, Math.floor((new Date(end).getTime() - authoritativeNow) / 1000));
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return (days ? days + 'd ' : '') + hours + 'h ' + minutes + 'm ' + secs + 's';
  };
  const unreadCount = visibleNotifications.filter(n => !n.read).length;

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
      </h2><button onClick={enablePushNotifications} disabled={pushBusy} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{pushBusy ? 'Enabling…' : '🔔 Enable mobile notifications'}</button>{unreadCount > 0 && <button onClick={markAllAsRead} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Mark all as read</button>}</div>
      
      {pushStatus && <div role="status" className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">{pushStatus}</div>}
      {error && (
        <div className="text-red-700 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {visibleNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          <div className="text-5xl mb-3">🔔</div>
          <h3 className="text-slate-800 font-semibold mb-1">No notifications yet</h3>
          <p>You will see important updates and announcements here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {visibleNotifications.map(notification => (
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
                  <div className={`mb-3 leading-relaxed text-sm sm:text-base ${notification.read ? 'text-slate-600' : 'text-slate-800'}`} dangerouslySetInnerHTML={{ __html: safeNotificationHtml(notification.message) }} />
                  {notification.countdownEndsAt && <div className="mb-3 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">⏳ Expires in {countdownText(notification.countdownEndsAt)}</div>}
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
