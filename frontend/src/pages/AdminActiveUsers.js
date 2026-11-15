import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../axios';

const getBrowser = (ua = '') => {
  const browser = ua.includes('Edg/') ? 'Microsoft Edge' : ua.includes('Chrome/') ? 'Google Chrome' : ua.includes('Firefox/') ? 'Firefox' : ua.includes('Safari/') && !ua.includes('Chrome/') ? 'Safari' : 'Browser';
  const device = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Device';
  return ua ? browser + ' · ' + device : 'Device details unavailable';
};

export default function AdminActiveUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [checkedAt, setCheckedAt] = useState(null);

  const loadUsers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/admin/active-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
      setCheckedAt(response.data.checkedAt || new Date().toISOString());
    } catch (err) {
      setError(err.response?.data?.message || 'Active users could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const timer = window.setInterval(() => loadUsers(true), 30000);
    return () => window.clearInterval(timer);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;
    return users.filter(user => [user.name, user.email].join(' ').toLowerCase().includes(term));
  }, [users, query]);

  const formatTime = value => value ? new Date(value).toLocaleString() : '—';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-700">Customer activity</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Active Users</h2>
          <p className="mt-1 text-sm text-slate-500">Users currently active on the ASKC TECHNOLOGIES website.</p>
        </div>
        <button onClick={() => loadUsers()} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
          <p className="text-sm font-medium text-emerald-800">Users online now</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-emerald-950">{users.length}</p>
          <p className="mt-1 text-xs text-emerald-700">Active within the last 2 minutes</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">Last updated</p>
          <p className="mt-2 text-base font-bold text-slate-900">{formatTime(checkedAt)}</p>
          <p className="mt-1 text-xs text-slate-500">Automatically refreshes every 30 seconds</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h3 className="font-bold text-slate-900">Currently online</h3><p className="mt-1 text-xs text-slate-500">Only registered customer accounts are listed here.</p></div>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or email…" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:max-w-xs" />
        </div>

        {error && <div role="alert" className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        {loading ? <div className="p-10 text-center text-sm text-slate-500">Checking active users…</div> :
          filteredUsers.length === 0 ? <div className="px-5 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">👤</div><p className="mt-3 font-semibold text-slate-800">{query ? 'No matching users' : 'No users online right now'}</p><p className="mt-1 text-sm text-slate-500">{query ? 'Try another name or email address.' : 'Users will appear here when they visit the site while signed in.'}</p></div> :
          <div className="divide-y divide-slate-100">
            {filteredUsers.map(user => (
              <div key={user._id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                  {user.image ? <img src={user.image} alt="" className="h-10 w-10 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-sky-700">{(user.name || 'U').slice(0,1).toUpperCase()}</div>}
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{user.name || 'Unnamed user'}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pl-[52px] sm:pl-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Online</span>
                  <span className="text-xs text-slate-500">{getBrowser(user.lastLoginUserAgent)}</span>
                  <span className="text-xs text-slate-500">Last activity: {formatTime(user.lastActiveAt)}</span>
                </div>
              </div>
            ))}
          </div>}
      </section>
      <p className="text-xs leading-relaxed text-slate-400">Online status is based on an authenticated activity signal. A user may remain shown as online for up to 2 minutes after closing the browser or losing connection.</p>
    </div>
  );
}
