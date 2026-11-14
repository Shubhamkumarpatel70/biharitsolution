import React, { useEffect, useState } from 'react';
import axios from '../axios';

const money = value => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const dateTime = value => value ? new Date(value).toLocaleString('en-IN') : '—';

export default function UserAgreements() {
  const [agreements, setAgreements] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [paymentFor, setPaymentFor] = useState(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('agreements');

  const headers = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') });
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [a, s] = await Promise.all([
        axios.get('/api/auth/user-agreements', { headers: headers() }),
        axios.get('/api/auth/user-subscriptions', { headers: headers() })
      ]);
      setAgreements(a.data.agreements || []);
      setSubscriptions(s.data.subscriptions || []);
    } catch (e) { setError(e.response?.data?.message || 'Could not load agreements and billing details.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAgreement = async doc => {
    try {
      const r = await axios.get('/api/auth/user-agreements/' + doc._id, { headers: headers() });
      setSelected(r.data.agreement);
    } catch (e) { setError(e.response?.data?.message || 'Could not open this agreement.'); }
  };
  const getLivePlace = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('This browser does not support live location.'));
    navigator.geolocation.getCurrentPosition(async position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const placeData = await response.json();
        const place = [placeData.locality || placeData.city, placeData.principalSubdivision, placeData.countryName].filter(Boolean).join(', ');
        resolve({ place: place || `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, latitude, longitude });
      } catch {
        resolve({ place: `GPS ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, latitude, longitude });
      }
    }, reject, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
  });

  const respondToAgreement = async (doc, action) => {
    if (doc.responseStatus === 'accepted' || doc.responseStatus === 'declined') return;
    let payload = { action };
    if (action === 'accept') {
      if (!window.confirm('To record your acceptance, ASKC will request your current location and record your name, place, date and India time in the agreement. Continue?')) return;
      try {
        payload = { ...payload, ...(await getLivePlace()) };
      } catch (locationError) {
        const manualPlace = window.prompt('Live location is unavailable or permission was denied. Enter your current city / place to continue accepting the agreement:');
        if (!manualPlace || !manualPlace.trim()) {
          setError('Location is required for acceptance. You can allow location access or enter your place manually.');
          return;
        }
        payload.place = manualPlace.trim();
      }
    } else {
      if (!window.confirm('Are you sure you want to decline this agreement?')) return;
      payload.reason = window.prompt('Optional reason for declining:') || '';
    }
    setRespondingId(doc._id); setError(''); setNotice('');
    try {
      const response = await axios.post('/api/auth/user-agreements/' + doc._id + '/respond', payload, { headers: headers() });
      setAgreements(prev => prev.map(item => item._id === doc._id ? { ...item, ...response.data.agreement, htmlContent: undefined } : item));
      setNotice(response.data.message || 'Your response has been recorded.');
      if (selected?._id === doc._id) setSelected(response.data.agreement);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not submit your agreement response.');
    } finally { setRespondingId(null); }
  };

  const submitPayment = async e => {
    e.preventDefault(); if (!paymentFor) return;
    setSaving(true); setNotice(''); setError('');
    try {
      const r = await axios.post('/api/auth/user-subscriptions/' + paymentFor._id + '/payment-request', { amount: Number(amount), reference }, { headers: headers() });
      setNotice(r.data.message || 'Payment details submitted.');
      setPaymentFor(null); setAmount(''); setReference(''); await load();
    } catch (e) { setError(e.response?.data?.message || 'Could not submit payment details.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="mx-auto max-w-5xl py-20 text-center text-slate-500">Loading your agreements…</div>;
  return <div className="mx-auto max-w-5xl space-y-6 pb-20">
    <header className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Client workspace</p>
      <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Agreements & Billing</h1>
      <p className="mt-2 text-sm text-slate-300">Review and respond to documents shared with your account.</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

    <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <button type="button" onClick={() => setActiveTab('agreements')} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeTab==='agreements'?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>Agreements</button>
      <button type="button" onClick={() => setActiveTab('billing')} className={`rounded-lg px-4 py-2.5 text-sm font-bold transition ${activeTab==='billing'?'bg-slate-900 text-white':'text-slate-600 hover:bg-slate-100'}`}>Assigned Plans & Billing</button>
    </div>
    {activeTab === 'billing' ? (
<section className="space-y-3">
        <div><h2 className="text-xl font-extrabold text-slate-900">Assigned plans & payments</h2><p className="text-sm text-slate-500">Payments submitted by you remain pending until verified by ASKC Technologies.</p></div>
        {subscriptions.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No plan has been assigned to your account yet.</div> : subscriptions.map(sub => {
          const entries = sub.paymentEntries || [];
          const paid = entries.filter(p => p.status === 'confirmed').reduce((n,p) => n + Number(p.amount || 0), 0) || Number(sub.amountPaid || 0);
          const due = Math.max(0, Number(sub.totalAmount || 0) - paid);
          const pending = entries.filter(p => p.status === 'pending').reduce((n,p) => n + Number(p.amount || 0), 0);
          return <article key={sub._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-lg font-extrabold text-slate-900">{sub.planName || sub.plan}</p><p className="mt-1 text-xs text-slate-500">Assigned {dateTime(sub.createdAt)} · Validity {sub.durationDays || '—'} days</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{sub.status}</span></div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Plan amount</p><p className="mt-1 font-extrabold text-slate-900">{money(sub.totalAmount)}</p></div>
              <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Paid</p><p className="mt-1 font-extrabold text-emerald-800">{money(paid)}</p></div>
              <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-700">Balance due</p><p className="mt-1 font-extrabold text-amber-800">{money(due)}</p></div>
              <div className="rounded-xl bg-blue-50 p-3"><p className="text-xs text-blue-700">Awaiting verification</p><p className="mt-1 font-extrabold text-blue-800">{money(pending)}</p></div>
            </div>
            {entries.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b text-slate-500"><th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Reference</th><th className="py-2">Status</th></tr></thead><tbody>{entries.map((p,i)=><tr key={p._id || i} className="border-b border-slate-100"><td className="py-2 pr-3">{dateTime(p.recordedAt)}</td><td className="py-2 pr-3 font-bold">{money(p.amount)}</td><td className="py-2 pr-3">{p.reference || '—'}</td><td className="py-2 capitalize">{p.status}</td></tr>)}</tbody></table></div>}
            {due > 0 && <button onClick={() => {setPaymentFor(sub);setAmount(String(due));}} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">Submit payment details</button>}
          </article>;
        })}
      </section>
    ) : (
<>
<section className="space-y-3">
        <div><h2 className="text-xl font-extrabold text-slate-900">My agreements</h2><p className="text-sm text-slate-500">Documents shared by ASKC Technologies for your account.</p></div>
        {agreements.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No agreements found for this account yet. Ask ASKC to generate the agreement using your registered account email.</div> : agreements.map(doc => {
          const responseStatus = doc.responseStatus || (doc.status === 'accepted' ? 'accepted' : doc.status === 'declined' ? 'declined' : 'pending');
          const responded = responseStatus === 'accepted' || responseStatus === 'declined';
          return <article key={doc._id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h3 className="break-words font-bold text-slate-900">{doc.documentTitle}</h3><p className="mt-1 text-xs text-slate-500">{doc.docCode || 'No document ID'} · {dateTime(doc.createdAt)}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${responseStatus === 'accepted' ? 'bg-emerald-100 text-emerald-800' : responseStatus === 'declined' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{responseStatus}</span>{doc.acceptedAtIST && <p className="mt-1 text-xs text-emerald-700">Accepted by {doc.acceptedByName} · {doc.acceptedPlace} · {doc.acceptedAtIST}</p>}{doc.declinedAt && <p className="mt-1 text-xs text-red-700">Declined by {doc.declinedByName} · {dateTime(doc.declinedAt)}</p>}</div><div className="flex flex-wrap gap-2 sm:justify-end"><button onClick={() => openAgreement(doc)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50">Open & review agreement</button></div></article>;
        })}
      </section>

      {selected && <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/70 p-2 sm:p-5" onClick={() => setSelected(null)}><div className="flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-3 sm:p-4">
          <div className="min-w-0"><p className="break-words text-sm font-bold text-slate-900">{selected.documentTitle}</p><p className="break-all text-xs text-slate-500">{selected.docCode}</p></div>
          <div className="flex shrink-0 gap-2"><button onClick={() => {const w=window.open('','_blank');if(w){w.document.write(selected.htmlContent);w.document.close();}}} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Print</button><button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2 text-xs font-bold">Close</button></div>
        </div>
        <iframe title="Agreement preview" sandbox="" srcDoc={selected.htmlContent} className="min-h-0 flex-1 bg-white"/>
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
          {(() => { const state = selected.responseStatus || (selected.status === 'accepted' ? 'accepted' : selected.status === 'declined' ? 'declined' : 'pending'); const responded = state === 'accepted' || state === 'declined'; return responded
            ? <p className="text-center text-sm font-semibold text-slate-600">This agreement has already been {state}. Your response is recorded.</p>
            : <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button disabled={respondingId === selected._id} onClick={() => respondToAgreement(selected, 'decline')} className="rounded-xl border border-red-300 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">Decline agreement</button>
              <button disabled={respondingId === selected._id} onClick={() => respondToAgreement(selected, 'accept')} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{respondingId === selected._id ? 'Saving acceptance…' : 'Accept agreement'}</button>
            </div>; })()}
        </div>
      </div></div>}
</>
    )}
    {paymentFor && <div className="fixed inset-0 z-[510] flex items-center justify-center bg-slate-950/60 p-4" onClick={() => !saving && setPaymentFor(null)}><form onSubmit={submitPayment} onClick={e=>e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl"><div><h3 className="text-lg font-extrabold text-slate-900">Submit instalment payment</h3><p className="mt-1 text-sm text-slate-500">Enter the amount you have paid and a UTR / transaction reference if available.</p></div><label className="block text-sm font-bold text-slate-700">Amount paid (₹)<input required type="number" min="0.01" max={Math.max(0,Number(paymentFor.totalAmount||0)-Number(paymentFor.amountPaid||0))} step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><label className="block text-sm font-bold text-slate-700">UTR / transaction reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded-xl border border-slate-300 p-3"/></label><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">This is a payment confirmation request, not an online payment gateway. Your balance changes only after ASKC verifies the payment.</p><div className="flex gap-2"><button type="button" onClick={()=>setPaymentFor(null)} className="flex-1 rounded-xl border p-3 text-sm font-bold">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-slate-900 p-3 text-sm font-bold text-white disabled:opacity-50">{saving?'Submitting…':'Submit for verification'}</button></div></form></div>}
  </div>;
}
