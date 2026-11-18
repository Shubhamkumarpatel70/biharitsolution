import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './AdminWorkspace.css';
import axios from '../axios';

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
      const color = (node.getAttribute('style') || '').match(/color\\s*:\\s*(#[0-9a-fA-F]{6})/);
      if (color) el.style.color = color[1];
    }
    Array.from(node.childNodes).forEach(child => el.appendChild(clean(child)));
    return el;
  };
  const root = document.createElement('div');
  Array.from(doc.body.childNodes).forEach(child => root.appendChild(clean(child)));
  return root.innerHTML;
}

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [archives, setArchives] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState('');
  const editorRef = useRef(null);
  const [countdownEnabled, setCountdownEnabled] = useState(false);
  const [countdownMinutes, setCountdownMinutes] = useState(60);
  const [selectedUser, setSelectedUser] = useState('');
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('active');
  const [composeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [autoMsg, setAutoMsg] = useState('');

  const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  const fetchNotifications = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [activeRes, archiveRes] = await Promise.all([
        axios.get('/api/auth/admin/notifications', authConfig()),
        axios.get('/api/auth/admin/notification-archives', authConfig())
      ]);
      setNotifications(Array.isArray(activeRes.data.notifications) ? activeRes.data.notifications : []);
      setArchives(Array.isArray(archiveRes.data.notifications) ? archiveRes.data.notifications : []);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not fetch notifications.');
    } finally { setLoading(false); }
  }, []);
  const fetchUsers = useCallback(async () => {
    try {
      const r = await axios.get('/api/auth/admin/users', authConfig());
      setUsers(Array.isArray(r.data.users) ? r.data.users : []);
    } catch { setUsers([]); }
  }, []);
  useEffect(() => { fetchNotifications(); fetchUsers(); }, [fetchNotifications, fetchUsers]);

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!form.trim()) return;
    setSending(true); setFeedback('');
    try {
      await axios.post('/api/auth/admin/notifications', { message: form.trim(), userId: selectedUser, countdownEnabled, countdownMinutes: Number(countdownMinutes) }, authConfig());
      setFeedback('Notification sent. It will remain here for 3 days, then move to Archives automatically.');
      setForm(''); setSelectedUser(''); setCountdownEnabled(false); setCountdownMinutes(60); if (editorRef.current) editorRef.current.innerHTML = ''; setComposeOpen(false); await fetchNotifications();
    } catch (e) { setFeedback(e.response?.data?.message || 'Could not send notification.'); }
    finally { setSending(false); }
  };
  const autoSend = async () => {
    setAutoMsg('');
    try {
      await axios.post('/api/auth/admin/auto-expiry-notifications', {}, authConfig());
      setAutoMsg('Expiry reminders sent to eligible users.'); fetchNotifications();
    } catch (e) { setAutoMsg(e.response?.data?.message || 'Could not send auto notifications.'); }
  };
  const source = activeView === 'archives' ? archives : notifications;
  const filtered = useMemo(() => source.filter(n => (n.message || '').toLowerCase().includes(search.trim().toLowerCase())), [source, search]);
  const fmt = value => value ? new Date(value).toLocaleString('en-IN') : 'Date unavailable';

  return (
    <main className="askc-admin-page space-y-5">
      <header className="askc-page-header">
        <div><h2 className="askc-page-title">Notifications</h2><p className="askc-page-subtitle">Send custom updates to users and manage notification history.</p></div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchNotifications} disabled={loading} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{loading ? 'Refreshing…' : '↻ Refresh'}</button>
          <button onClick={() => { setComposeOpen(true); setFeedback(''); }} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-800">＋ Custom notification</button>
        </div>
      </header>

      {feedback && <div role="status" className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">{feedback}</div>}
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

      {composeOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="custom-notification-title">
        <form onSubmit={sendNotification} className="w-full max-w-xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h3 id="custom-notification-title" className="text-xl font-extrabold text-slate-900">Custom notification</h3><p className="mt-1 text-sm text-slate-500">Send to every user or choose one recipient.</p></div><button type="button" onClick={() => setComposeOpen(false)} className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">✕</button></div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Message</label>
            <div className="flex flex-wrap items-center gap-2 rounded-t-xl border border-slate-200 bg-slate-50 p-2">
              <button type="button" onClick={() => { editorRef.current?.focus(); document.execCommand('bold'); setForm(editorRef.current?.innerHTML || ''); }} className="rounded-lg border bg-white px-3 py-1.5 text-sm font-bold">B</button>
              <button type="button" onClick={() => { editorRef.current?.focus(); document.execCommand('italic'); setForm(editorRef.current?.innerHTML || ''); }} className="rounded-lg border bg-white px-3 py-1.5 text-sm italic">I</button>
              <label className="flex items-center gap-2 rounded-lg border bg-white px-2 py-1 text-xs font-semibold">Text color <input aria-label="Text color" type="color" defaultValue="#1d4ed8" onChange={e => { editorRef.current?.focus(); document.execCommand('foreColor', false, e.target.value); setForm(editorRef.current?.innerHTML || ''); }} /></label>
            </div>
            <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e => setForm(e.currentTarget.innerHTML)} className="min-h-[120px] rounded-b-xl border border-t-0 border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100" />
            <p className="text-xs text-slate-500">Use Bold, Italic and Text color. Unsupported formatting and unsafe HTML are removed before saving.</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="mb-2 text-xs font-bold uppercase text-slate-500">Formatting preview</p><div className="break-words text-sm" dangerouslySetInnerHTML={{ __html: safeNotificationHtml(form) }} /></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500"><span>Notification will be archived after 3 days.</span><span>{form.replace(/<[^>]*>/g, '').length}/2000</span></div>
          <div className="rounded-xl border border-slate-200 p-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={countdownEnabled} onChange={e => setCountdownEnabled(e.target.checked)} /> Enable countdown timer</label>
            {countdownEnabled && <label className="mt-3 block text-sm font-semibold text-slate-700">Countdown duration (minutes)<input type="number" min="1" max="10080" value={countdownMinutes} onChange={e => setCountdownMinutes(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 p-2" /></label>}
            {countdownEnabled && <p className="mt-1 text-xs text-slate-500">The server saves the exact end time. The notification disappears from the user dashboard when it reaches zero.</p>}
          </div>
          <label className="block text-sm font-semibold text-slate-700">Recipient<select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800"><option value="">All users</option>{users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}</select></label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setComposeOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button><button type="submit" disabled={!form.replace(/<[^>]*>/g, '').trim() || sending || (countdownEnabled && (!Number.isInteger(Number(countdownMinutes)) || Number(countdownMinutes) < 1 || Number(countdownMinutes) > 10080))} className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send notification'}</button></div>
        </form>
      </div>}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Active notifications</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{notifications.length}</p><p className="mt-1 text-xs text-slate-500">Custom notices stay active for 3 days.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">Archived notifications</p><p className="mt-2 text-3xl font-extrabold text-slate-900">{archives.length}</p><p className="mt-1 text-xs text-slate-500">Older custom notices are kept here.</p></div>
        <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-amber-700">Automation</p><h3 className="mt-2 text-base font-extrabold text-slate-900">Plan expiry reminders</h3><p className="mt-1 text-sm text-slate-500">Run the existing reminder workflow for users with 2 days remaining.</p><button onClick={autoSend} className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100">Send expiry reminders</button>{autoMsg && <p role="status" className="mt-2 text-xs text-amber-800">{autoMsg}</p>}</div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h3 className="text-lg font-extrabold text-slate-900">{activeView === 'archives' ? 'Notification Archives' : 'Notification history'}</h3><p className="text-sm text-slate-500">{filtered.length} {activeView === 'archives' ? 'archived' : 'active'} records</p></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notification…" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 sm:max-w-xs"/>
        </div>
        <div className="mt-4 flex gap-2 border-b border-slate-100 pb-3">
          <button onClick={() => setActiveView('active')} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeView === 'active' ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>Active ({notifications.length})</button>
          <button onClick={() => setActiveView('archives')} className={`rounded-xl px-4 py-2 text-sm font-bold ${activeView === 'archives' ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}>Archives ({archives.length})</button>
        </div>
        {loading ? <div className="py-10 text-center text-slate-500">Loading notifications…</div> : filtered.length === 0 ? <div className="py-10 text-center text-sm text-slate-500">No notifications found.</div> : <div className="mt-4 space-y-3">{filtered.map((n, i) => <article key={n._id || i} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2"><div className="break-words text-sm font-semibold text-slate-800" dangerouslySetInnerHTML={{ __html: safeNotificationHtml(n.message) }} /><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${activeView === 'archives' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-50 text-emerald-700'}`}>{activeView === 'archives' ? 'Archived' : 'Active'}</span></div>
          <p className="mt-2 text-xs text-slate-500">To: {n.user ? `${n.user.name || 'Selected user'} · ${n.user.email || ''}` : 'All users'} · Sent: {fmt(n.createdAt)}</p>
          {n.countdownEndsAt && <p className="mt-1 text-xs font-semibold text-amber-700">Countdown ends: {fmt(n.countdownEndsAt)}</p>}{n.archiveAt && <p className="mt-1 text-xs text-slate-500">{activeView === 'archives' ? 'Archived after: ' : 'Auto archives: '}{fmt(n.archiveAt)}</p>}
        </article>)}</div>}
      </section>
    </main>
  );
};
export default AdminNotifications;
