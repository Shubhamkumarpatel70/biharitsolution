import React, { useEffect, useState } from 'react';
import axios from '../axios';

const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—';

const AdminUserPlans = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [usersRes, subsRes] = await Promise.all([
          axios.get('/api/auth/admin/users', { headers }),
          axios.get('/api/auth/admin/all-subscriptions', { headers })
        ]);
        const users = usersRes.data.users || [];
        const allSubs = subsRes.data.subscriptions || [];
        const planData = users.map(user => {
          const userSubs = allSubs
            .filter(s => s.user && (s.user._id === user._id || s.user === user._id))
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          const latest = userSubs[0];
          return {
            id: user._id,
            name: user.name,
            email: user.email,
            registeredAt: user.createdAt,
            plan: latest ? (latest.planName || latest.plan) : 'None',
            subscriptionId: latest?._id,
            totalAmount: Number(latest?.totalAmount || 0),
            discountAmount: Number(latest?.discountAmount || 0),
            payableAmount: Math.max(0, Number(latest?.totalAmount || 0) - Number(latest?.discountAmount || 0)),
            amountPaid: Array.isArray(latest?.paymentEntries) && latest.paymentEntries.some(entry => entry.status === 'confirmed')
              ? latest.paymentEntries.filter(entry => entry.status === 'confirmed').reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
              : Number(latest?.amountPaid || 0),
            couponCode: latest?.couponCode || '',
            transactionId: latest?.transactionId || latest?.cashfreeOrderId || '',
            uniqueId: latest?.uniqueId || '',
            createdAt: latest?.createdAt,
            cancellationReason: latest?.cancellationReason || '',
            cancellationInitiatedBy: latest?.cancellationInitiatedBy || '',
            cancellationStatus: latest?.cancellationStatus || 'none',
            refundStatus: latest?.refundStatus || 'not_reviewed',
            refundAmount: Number(latest?.refundAmount || 0),
            canceled: Boolean(latest?.canceled),
            expiresAt: latest?.expiresAt,
            status: latest ? (latest.canceled ? 'cancelled' : latest.status) : 'N/A',
          };
        });
        setData(planData);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not fetch user plans.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTerminate = async (user) => {
    if (!user.subscriptionId || user.canceled || user.status === 'expired') return;
    const reason = window.prompt('Reason for cancelling / terminating this plan:');
    if (!reason || !reason.trim()) return;
    if (!window.confirm('Confirm termination of ' + user.plan + ' for ' + user.name + '? This will immediately make the plan inactive.')) return;
    setActionBusy(user.subscriptionId); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch('/api/auth/admin/terminate-subscription/' + user.subscriptionId, { reason: reason.trim() }, { headers: { Authorization: 'Bearer ' + token } });
      setSuccess('Subscription terminated successfully.');
      const usersRes = await axios.get('/api/auth/admin/users', { headers: { Authorization: 'Bearer ' + token } });
      const subsRes = await axios.get('/api/auth/admin/all-subscriptions', { headers: { Authorization: 'Bearer ' + token } });
      const allSubs = subsRes.data.subscriptions || [];
      setData((usersRes.data.users || []).map(account => {
        const latest = allSubs.filter(s => s.user && (s.user._id === account._id || s.user === account._id)).sort((a,b) => new Date(b.createdAt || 0)-new Date(a.createdAt || 0))[0];
        return { id: account._id, name: account.name, email: account.email, registeredAt: account.createdAt, plan: latest ? (latest.planName || latest.plan) : 'None', subscriptionId: latest?._id, totalAmount: Number(latest?.totalAmount || 0), discountAmount: Number(latest?.discountAmount || 0), payableAmount: Math.max(0, Number(latest?.totalAmount || 0) - Number(latest?.discountAmount || 0)), amountPaid: Array.isArray(latest?.paymentEntries) && latest.paymentEntries.some(entry => entry.status === 'confirmed') ? latest.paymentEntries.filter(entry => entry.status === 'confirmed').reduce((sum, entry) => sum + Number(entry.amount || 0), 0) : Number(latest?.amountPaid || 0), couponCode: latest?.couponCode || '', transactionId: latest?.transactionId || latest?.cashfreeOrderId || '', uniqueId: latest?.uniqueId || '', createdAt: latest?.createdAt, cancellationReason: latest?.cancellationReason || '', canceled: Boolean(latest?.canceled), expiresAt: latest?.expiresAt, status: latest ? (latest.canceled ? 'cancelled' : latest.status) : 'N/A' };
      }));
    } catch (err) { setError(err.response?.data?.message || 'Could not terminate subscription.'); }
    finally { setActionBusy(null); }
  };

  const statusClass = (status) => status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'pending' ? 'bg-amber-100 text-amber-700' : status === 'cancelled' || status === 'expired' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="user-plans-page w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subscriptions</p>
          <h2 className="text-2xl font-bold text-slate-900">User Plans</h2>
        </div>
        <span className="text-sm text-slate-500">{data.length} users</span>
      </div>
      {success && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center text-slate-500">Loading user plans…</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      ) : data.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center text-slate-500">No users found.</div>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Registered</th><th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3">Purchase / Payment details</th><th className="px-4 py-3">Assigned At</th><th className="px-4 py-3">Expires At</th><th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-4 py-3 break-all">{user.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDateTime(user.registeredAt)}</td>
                    <td className="px-4 py-3 capitalize">{user.plan}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClass(user.status)}`}>{user.status}</span></td>
                    <td className="px-4 py-3 min-w-[220px]"><div className="space-y-1 text-xs"><div>Original: <b>₹{Number(user.totalAmount).toLocaleString('en-IN')}</b></div><div>Coupon: <b>{user.couponCode || 'No coupon'}</b></div><div>Discount: <b className="text-emerald-700">₹{Number(user.discountAmount).toLocaleString('en-IN')}</b></div><div>Payable: <b>₹{Number(user.payableAmount).toLocaleString('en-IN')}</b></div><div>Received: <b className="text-emerald-700">₹{Number(user.amountPaid).toLocaleString('en-IN')}</b></div><div className="break-all">Subscription: <b className="font-mono">{user.uniqueId || user.subscriptionId || '—'}</b></div><div className="break-all">Transaction: <b className="font-mono">{user.transactionId || '—'}</b></div>{(user.canceled || user.cancellationStatus === 'approved') && <div>Cancelled by: <b>{user.cancellationInitiatedBy === 'askc' ? 'ASKC TECHNOLOGIES' : user.cancellationInitiatedBy === 'user' ? 'Self (User)' : 'Not recorded'}</b></div>}<div>Refund: <b className="capitalize">{user.refundStatus.replace(/_/g, ' ')}</b>{user.refundAmount > 0 ? ' · ₹' + user.refundAmount.toLocaleString('en-IN') : ''}</div></div></td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(user.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{user.expiresAt ? formatDateTime(user.expiresAt) : '—'}</td>
                    <td className="px-4 py-3">{user.subscriptionId && !user.canceled && user.status !== 'expired' ? <button onClick={() => handleTerminate(user)} disabled={actionBusy === user.subscriptionId} className="whitespace-nowrap rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">{actionBusy === user.subscriptionId ? 'Processing…' : 'Cancel / Terminate'}</button> : <span className="text-xs text-slate-400">No action</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.map(user => (
              <article key={user.id} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="font-semibold text-slate-900 break-words">{user.name}</h3><p className="mt-1 text-sm text-slate-500 break-all">{user.email}</p></div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold capitalize ${statusClass(user.status)}`}>{user.status}</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div><dt className="text-xs text-slate-500">Plan</dt><dd className="mt-1 font-medium">{user.plan}</dd></div>
                  <div><dt className="text-xs text-slate-500">Original price</dt><dd className="mt-1 font-medium">₹{Number(user.totalAmount).toLocaleString('en-IN')}</dd></div><div><dt className="text-xs text-slate-500">Coupon / Discount</dt><dd className="mt-1 break-words font-medium">{user.couponCode || 'No coupon'} · ₹{Number(user.discountAmount).toLocaleString('en-IN')}</dd></div><div><dt className="text-xs text-slate-500">Payable / Received</dt><dd className="mt-1 font-medium">₹{Number(user.payableAmount).toLocaleString('en-IN')} / ₹{Number(user.amountPaid).toLocaleString('en-IN')}</dd></div><div className="col-span-2"><dt className="text-xs text-slate-500">Transaction ID</dt><dd className="mt-1 break-all font-mono text-xs">{user.transactionId || '—'}</dd></div><div className="col-span-2"><dt className="text-xs text-slate-500">Subscription ID</dt><dd className="mt-1 break-all font-mono text-xs">{user.uniqueId || user.subscriptionId || '—'}</dd></div><div><dt className="text-xs text-slate-500">Cancelled by</dt><dd className="mt-1 font-medium">{user.canceled || user.status === 'cancelled' ? (user.cancellationInitiatedBy === 'askc' ? 'ASKC TECHNOLOGIES' : user.cancellationInitiatedBy === 'user' ? 'Self (User)' : 'Not recorded') : '—'}</dd></div><div><dt className="text-xs text-slate-500">Refund status</dt><dd className="mt-1 font-medium capitalize">{user.refundStatus.replace(/_/g, ' ')}{user.refundAmount > 0 ? ' · ₹' + user.refundAmount.toLocaleString('en-IN') : ''}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-slate-500">Assigned at</dt><dd className="mt-1 font-medium">{formatDateTime(user.createdAt)}</dd></div>
                  <div><dt className="text-xs text-slate-500">Expires</dt><dd className="mt-1 font-medium">{user.expiresAt ? formatDateTime(user.expiresAt) : '—'}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-slate-500">Registered</dt><dd className="mt-1 font-medium">{formatDateTime(user.registeredAt)}</dd></div>
                </dl>
                {user.subscriptionId && !user.canceled && user.status !== 'expired' && <button onClick={() => handleTerminate(user)} disabled={actionBusy === user.subscriptionId} className="mt-4 w-full rounded-lg bg-rose-600 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50">{actionBusy === user.subscriptionId ? 'Processing…' : 'Cancel / Terminate Plan'}</button>}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUserPlans;
