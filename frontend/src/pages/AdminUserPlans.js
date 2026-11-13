import React, { useEffect, useState } from 'react';
import axios from '../axios';

const formatDateTime = (value) => value ? new Date(value).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
}) : '—';

const AdminUserPlans = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            plan: latest ? latest.plan : 'None',
            expiresAt: latest?.expiresAt,
            status: latest ? latest.status : 'N/A',
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

  const statusClass = (status) => status === 'active'
    ? 'bg-emerald-100 text-emerald-700'
    : status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600';

  return (
    <div className="user-plans-page w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subscriptions</p>
          <h2 className="text-2xl font-bold text-slate-900">User Plans</h2>
        </div>
        <span className="text-sm text-slate-500">{data.length} users</span>
      </div>
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
                  <th className="px-4 py-3">Status</th><th className="px-4 py-3">Expires At</th>
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
                    <td className="px-4 py-3 whitespace-nowrap">{user.expiresAt ? formatDateTime(user.expiresAt) : '—'}</td>
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
                  <div><dt className="text-xs text-slate-500">Plan</dt><dd className="mt-1 font-medium capitalize">{user.plan}</dd></div>
                  <div><dt className="text-xs text-slate-500">Expires</dt><dd className="mt-1 font-medium">{user.expiresAt ? formatDateTime(user.expiresAt) : '—'}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-slate-500">Registered</dt><dd className="mt-1 font-medium">{formatDateTime(user.registeredAt)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUserPlans;
