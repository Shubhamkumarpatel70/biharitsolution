import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from '../axios';

const money = value => '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const dateTime = value => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function AdminTransactions() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ search, status, method });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/admin/transactions?' + params.toString(), { headers: { Authorization: `Bearer ${token}` } });
      setRows(Array.isArray(res.data.transactions) ? res.data.transactions : []);
      setSummary(res.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Transactions could not be loaded.');
    } finally { setLoading(false); }
  }, [search, status, method, from, to]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const columns = ['Transaction ID','Customer','Email','Plan','Amount','Payment Method','Payment Status','Refund Status','Coupon','Date'];
    const values = rows.map(row => [row.transactionId || row.cashfreeOrderId || row.uniqueId, row.user?.name, row.user?.email, row.planName || row.plan, row.amountPaid ?? row.totalAmount, row.paymentMethod, row.paymentStatus, row.refundStatus, row.couponCode, row.createdAt]);
    const csv = [columns, ...values].map(line => line.map(value => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'askc-transactions.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  const statusStyle = value => ['paid','success','completed','confirmed','active'].includes(String(value || '').toLowerCase()) ? 'bg-emerald-50 text-emerald-700' : ['pending'].includes(String(value || '').toLowerCase()) ? 'bg-amber-50 text-amber-700' : ['failed','rejected'].includes(String(value || '').toLowerCase()) ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600';

  return <div className="mx-auto w-full max-w-7xl space-y-5 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Finance & Billing</p><h2 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Transactions</h2><p className="mt-1 text-sm text-slate-500">Search and review customer payments, gateway references and refunds.</p></div>
      <div className="flex gap-2"><button onClick={load} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Refresh</button><button onClick={exportCsv} disabled={!rows.length} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Export CSV</button></div>
    </header>
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {[['Total',summary.total],['Successful',summary.successful],['Pending',summary.pending],['Failed',summary.failed],['Refunded',summary.refunded]].map(([label,value])=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{Number(value||0).toLocaleString('en-IN')}</p></div>)}
    </section>
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transaction ID, customer, email, plan or coupon…" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"/>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <select value={status} onChange={e=>setStatus(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"><option value="all">All statuses</option><option value="success">Successful</option><option value="pending">Pending</option><option value="failed">Failed / Rejected</option><option value="refunded">Refunded</option><option value="cancelled">Cancelled</option></select>
        <select value={method} onChange={e=>setMethod(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"><option value="all">All payment methods</option><option value="cashfree">Cashfree</option><option value="upi">UPI / Manual</option><option value="card">Card</option><option value="netbanking">Net banking</option></select>
        <input aria-label="From date" type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-3 text-sm"/>
        <input aria-label="To date" type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-3 text-sm"/>
      </div>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><h3 className="font-bold text-slate-900">Payment records</h3><p className="text-xs text-slate-500">{rows.length} records shown (up to 500)</p></div><p className="text-sm font-bold text-slate-800">Gross recorded: {money(summary.grossAmount)}</p></div>
      {loading ? <p className="p-10 text-center text-sm text-slate-500">Loading transactions…</p> : error ? <p className="p-8 text-center text-sm text-rose-600">{error}</p> : !rows.length ? <p className="p-10 text-center text-sm text-slate-500">No transactions match these filters.</p> :
      <div className="divide-y divide-slate-100">{rows.map(row=><button key={row._id} onClick={()=>setSelected(row)} className="grid w-full grid-cols-1 gap-2 px-4 py-4 text-left transition hover:bg-slate-50 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center sm:px-5">
        <span className="min-w-0"><span className="block truncate font-mono text-xs font-bold text-blue-700">{row.transactionId || row.cashfreeOrderId || row.uniqueId || row._id}</span><span className="mt-1 block truncate text-sm font-semibold text-slate-900">{row.user?.name || 'Unknown customer'}</span><span className="block truncate text-xs text-slate-500">{row.user?.email || '—'}</span></span>
        <span><span className="block text-sm font-bold text-slate-900">{money(row.amountPaid ?? row.totalAmount)}</span><span className="text-xs capitalize text-slate-500">{row.planName || row.plan || 'Plan'}</span></span>
        <span><span className="block text-xs capitalize text-slate-600">{row.paymentMethod || '—'}</span><span className="text-xs text-slate-500">{dateTime(row.createdAt)}</span></span>
        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(row.paymentStatus || row.status)}`}>{row.paymentStatus || row.status || 'Unknown'}</span>
      </button>)}</div>}
    </section>
    {selected && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4" onClick={()=>setSelected(null)}><div role="dialog" aria-modal="true" className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><h3 className="text-lg font-bold text-slate-900">Transaction details</h3><button onClick={()=>setSelected(null)} className="rounded-lg border px-3 py-1.5 text-sm">Close</button></div><div className="mt-4 grid grid-cols-2 gap-4 text-sm">{[['Transaction ID',selected.transactionId || selected.cashfreeOrderId || selected.uniqueId],['Customer',selected.user?.name],['Email',selected.user?.email],['Plan',selected.planName || selected.plan],['Amount paid',money(selected.amountPaid ?? selected.totalAmount)],['Discount',money(selected.discountAmount)],['Coupon',selected.couponCode || '—'],['Payment method',selected.paymentMethod],['Payment status',selected.paymentStatus],['Refund status',selected.refundStatus],['Refund amount',money(selected.refundAmount)],['Created',dateTime(selected.createdAt)],['Gateway order ID',selected.cashfreeOrderId || '—']].map(([k,v])=><div key={k} className="min-w-0"><p className="text-xs text-slate-500">{k}</p><p className="mt-1 break-words font-semibold text-slate-800">{v || '—'}</p></div>)}</div></div></div>}
  </div>;
}
