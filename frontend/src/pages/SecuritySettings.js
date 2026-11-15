import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { useNavigate } from 'react-router-dom';

function SessionLoginInfo() {
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [busySession, setBusySession] = useState('');
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const loadInfo = async () => {
    setLoadingInfo(true); setSessionError('');
    try { const response = await axios.get('/api/auth/sessions', auth()); setInfo(response.data); }
    catch (error) { setSessionError(error.response?.data?.message || 'Login sessions could not be loaded.'); }
    finally { setLoadingInfo(false); }
  };
  useEffect(() => { loadInfo(); }, []);
  useEffect(() => {
    if (!sessionNotice) return undefined;
    const timer = window.setTimeout(() => setSessionNotice(''), 4500);
    return () => window.clearTimeout(timer);
  }, [sessionNotice]);

  const browser = (ua = '') => {
    if (!ua) return 'Unknown browser';
    const name = ua.includes('Edg/') ? 'Microsoft Edge' : ua.includes('Chrome/') ? 'Google Chrome' : ua.includes('Firefox/') ? 'Mozilla Firefox' : ua.includes('Safari/') && !ua.includes('Chrome/') ? 'Safari' : 'Browser';
    const device = /Android/i.test(ua) ? 'Android device' : /iPhone|iPad/i.test(ua) ? 'Apple device' : /Windows/i.test(ua) ? 'Windows device' : /Mac OS/i.test(ua) ? 'Mac device' : /Linux/i.test(ua) ? 'Linux device' : 'Device';
    return name + ' · ' + device;
  };

  const logoutDevice = async session => {
    setBusySession(session.sessionId); setSessionError(''); setSessionNotice('');
    try {
      await axios.post(`/api/auth/sessions/${encodeURIComponent(session.sessionId)}/logout`, {}, auth());
      if (session.current) {
        localStorage.removeItem('token'); localStorage.removeItem('user');
        delete axios.defaults.headers.common.Authorization;
        navigate('/login', { replace: true, state: { message: 'This device has been signed out.' } });
        return;
      }
      setInfo(current => current ? { ...current, sessions: current.sessions.filter(item => item.sessionId !== session.sessionId) } : current);
      setSessionNotice('Device logged out successfully.');
    } catch (error) {
      setSessionError(error.response?.data?.message || 'Could not sign out this device.');
    } finally { setBusySession(''); }
  };

  const logoutAll = async () => {
    setLogoutBusy(true); setSessionError('');
    try {
      await axios.post('/api/auth/sessions/logout-all', {}, auth());
      localStorage.removeItem('token'); localStorage.removeItem('user');
      delete axios.defaults.headers.common.Authorization;
      navigate('/login', { replace: true, state: { message: 'You have been signed out from all devices. Please log in again.' } });
    } catch (error) {
      setSessionError(error.response?.data?.message || 'Could not sign out all devices.');
      setLogoutBusy(false);
    }
  };

  const sessions = info?.sessions || [];
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Account activity</p><h3 className="mt-1 text-lg font-bold text-slate-900">Session &amp; Login Info</h3><p className="mt-1 text-sm text-slate-500">Review every device signed in to your account and manage sessions individually.</p></div>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{sessions.length} active {sessions.length === 1 ? 'session' : 'sessions'}</span>
    </div>
    {sessionNotice && <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">{sessionNotice}</p>}
    <div className="mt-5 space-y-3">
      {loadingInfo ? <p className="text-sm text-slate-500">Loading login sessions…</p> : sessions.length ? sessions.map(session => <article key={session.sessionId} className="rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-bold text-slate-900">{browser(session.userAgent)}</h4>{session.current && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">This Device</span>}</div>
            <p className="mt-2 text-xs text-slate-500">Signed in: {session.createdAt ? new Date(session.createdAt).toLocaleString() : 'Unknown'}</p>
            <p className="mt-1 text-xs text-slate-500">Last active: {session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : 'Unknown'}</p>
            <p className="mt-1 break-all text-xs text-slate-500">IP address: {session.ip || 'Not available'}</p>
          </div>
          <button type="button" onClick={() => setConfirmAction({ type: 'single', session })} disabled={!!busySession || logoutBusy} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50">{busySession === session.sessionId ? 'Logging out…' : 'Logout'}</button>
        </div>
      </article>) : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">No tracked sessions found. Sign in again to register this device.</div>}
    </div>
    {sessionError && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{sessionError}</p>}
    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-xl text-xs leading-relaxed text-slate-500">Logging out a device revokes only that selected session. Logout All signs out every device, including this one.</p>
      <button type="button" onClick={() => setConfirmAction({ type: 'all' })} disabled={logoutBusy || loadingInfo || sessions.length === 0} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50">{logoutBusy ? 'Logging out…' : 'Logout All'}</button>
    </div>
    <button type="button" onClick={loadInfo} disabled={loadingInfo || !!busySession || logoutBusy} className="mt-3 text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:opacity-50">Refresh sessions</button>

    {confirmAction && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busySession && !logoutBusy) setConfirmAction(null); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="session-confirm-title" aria-describedby="session-confirm-description" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600"><span aria-hidden="true" className="text-xl">↪</span></div>
          <div><h3 id="session-confirm-title" className="text-lg font-bold text-slate-900">{confirmAction.type === 'all' ? 'Logout All Devices?' : 'Logout This Device?'}</h3>
            <p id="session-confirm-description" className="mt-2 text-sm leading-relaxed text-slate-600">{confirmAction.type === 'all' ? 'This will log you out from every device, including the device you are using now. You will need to sign in again.' : `Are you sure you want to log out this device? ${confirmAction.session?.current ? 'You will need to log in again to access your account.' : 'Only this selected device will be logged out. Your other devices will remain signed in.'}`}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setConfirmAction(null)} disabled={!!busySession || logoutBusy} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={async () => { const action = confirmAction; setConfirmAction(null); if (action.type === 'all') await logoutAll(); else await logoutDevice(action.session); }} disabled={!!busySession || logoutBusy} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">{busySession || logoutBusy ? 'Please wait…' : confirmAction.type === 'all' ? 'Yes, Logout All' : 'Yes, Logout'}</button>
        </div>
      </div>
    </div>}
  </section>;
}

export default function SecuritySettings() {
  const [security, setSecurity] = useState({ enabled: false, method: '', email: '' });
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
  const load = async () => {
    setLoading(true);
    try { const res = await axios.get('/api/auth/security/2fa', auth()); setSecurity(res.data); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Security settings could not be loaded.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startAuthenticator = async () => {
    setBusy(true); setMessage({ type: '', text: '' });
    try { const res = await axios.post('/api/auth/security/2fa/authenticator/setup', {}, auth()); setSecret(res.data.secret); setCode(''); setMessage({ type: 'success', text: 'Add the displayed key to your authenticator app, then enter its current 6-digit code.' }); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Could not start authenticator setup.' }); }
    finally { setBusy(false); }
  };
  const verifyAuthenticator = async e => {
    e.preventDefault(); setBusy(true); setMessage({ type: '', text: '' });
    try { const res = await axios.post('/api/auth/security/2fa/authenticator/verify', { code }, auth()); setMessage({ type: 'success', text: res.data.message }); setSecret(''); setCode(''); await load(); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Authenticator verification failed.' }); }
    finally { setBusy(false); }
  };
  const sendEmailCode = async () => {
    setBusy(true); setMessage({ type: '', text: '' });
    try { const res = await axios.post('/api/auth/security/2fa/email/send', {}, auth()); setMessage({ type: 'success', text: res.data.message }); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Could not send email code.' }); }
    finally { setBusy(false); }
  };
  const verifyEmail = async e => {
    e.preventDefault(); setBusy(true); setMessage({ type: '', text: '' });
    try { const res = await axios.post('/api/auth/security/2fa/email/verify', { code }, auth()); setMessage({ type: 'success', text: res.data.message }); setCode(''); await load(); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Email verification failed.' }); }
    finally { setBusy(false); }
  };
  const disable = async e => {
    e.preventDefault(); setBusy(true); setMessage({ type: '', text: '' });
    try { const res = await axios.post('/api/auth/security/2fa/disable', { password, code }, auth()); setMessage({ type: 'success', text: res.data.message }); setPassword(''); setCode(''); await load(); }
    catch (err) { setMessage({ type: 'error', text: err.response?.data?.message || 'Could not disable 2FA.' }); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading security settings…</div>;
  return <div className="mx-auto w-full max-w-4xl space-y-5 pb-8">
    <header><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Account</p><h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Settings & Security</h2><p className="mt-1 text-sm text-slate-500">Protect your account with a second verification step at sign-in.</p></header>
    <SessionLoginInfo />
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Two-Factor Authentication</h3><p className="mt-1 text-sm text-slate-500">Choose an authenticator app or a one-time code sent to your registered email.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${security.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{security.enabled ? 'Enabled' : 'Not enabled'}</span></div>
      {security.enabled && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Your sign-in verification method is <strong>{security.method === 'email' ? 'Email OTP' : 'Authenticator App'}</strong>.</div>}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2"><span className="text-xl">🔐</span><h4 className="font-bold text-slate-900">Authenticator App</h4></div>
          <p className="mt-2 text-sm text-slate-500">Use Google Authenticator, Microsoft Authenticator or another TOTP-compatible app. You can enter the setup key manually.</p>
          {!secret ? <button disabled={busy} onClick={startAuthenticator} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{security.method === 'authenticator' ? 'Set up again' : 'Set up authenticator'}</button> :
          <form onSubmit={verifyAuthenticator} className="mt-4 space-y-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Setup key (keep private)</p><p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">{secret}</p><button type="button" onClick={()=>navigator.clipboard?.writeText(secret)} className="mt-2 text-xs font-semibold text-blue-700">Copy setup key</button></div><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" maxLength={6} placeholder="6-digit authenticator code" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"/><button disabled={busy || code.length!==6} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Verify and enable</button></form>}
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2"><span className="text-xl">✉️</span><h4 className="font-bold text-slate-900">Email OTP</h4></div>
          <p className="mt-2 text-sm text-slate-500">A 6-digit verification code will be sent to your registered email address.</p><p className="mt-2 break-all text-xs font-semibold text-slate-700">{security.email}</p>
          <button disabled={busy} onClick={sendEmailCode} className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 disabled:opacity-50">Send email verification code</button>
          <form onSubmit={verifyEmail} className="mt-3 space-y-3"><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" maxLength={6} placeholder="Enter email OTP" className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm"/><button disabled={busy || code.length!==6} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Verify and enable email 2FA</button></form>
        </div>
      </div>
      {security.enabled && <form onSubmit={disable} className="mt-5 rounded-xl border border-rose-200 bg-rose-50/50 p-4"><h4 className="font-bold text-rose-800">Turn off 2FA</h4><p className="mt-1 text-xs text-slate-600">Confirm your password and a current code from your active verification method. For email 2FA, send a fresh code first.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Current password" className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"/><input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Current 6-digit code" inputMode="numeric" maxLength={6} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"/></div>{security.method==='email' && <button type="button" onClick={sendEmailCode} disabled={busy} className="mt-2 text-xs font-semibold text-blue-700">Send a fresh email code</button>}<button disabled={busy || !password || code.length!==6} className="mt-3 w-full rounded-xl border border-rose-300 bg-white px-4 py-3 text-sm font-semibold text-rose-700 disabled:opacity-50">Disable two-factor authentication</button></form>}
    </section>
    {message.text && <p role="status" className={`rounded-xl border px-4 py-3 text-sm ${message.type==='success'?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-rose-200 bg-rose-50 text-rose-700'}`}>{message.text}</p>}
  </div>;
}
