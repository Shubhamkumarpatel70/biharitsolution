import React, { useEffect, useMemo, useState } from 'react';
import axios from '../axios';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', amount: '', usageLimit: '1' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/auth/coupons', authConfig());
      setCoupons(Array.isArray(res.data.coupons) ? res.data.coupons : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Coupons could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const stats = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter(c => c.active).length,
    inactive: coupons.filter(c => !c.active).length,
    redemptions: coupons.reduce((sum, c) => sum + (Number(c.usedCount) || 0), 0)
  }), [coupons]);

  const visibleCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();
    return coupons.filter(coupon => {
      const matchesSearch = !query || String(coupon.code || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && coupon.active) ||
        (statusFilter === 'inactive' && !coupon.active);
      return matchesSearch && matchesStatus;
    });
  }, [coupons, search, statusFilter]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: name === 'code' ? value.toUpperCase().replace(/\\s/g, '') : value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setMessage({ type: '', text: '' });
    const amount = Number(form.amount);
    const usageLimit = Number(form.usageLimit);
    if (!form.code.trim() || !Number.isFinite(amount) || amount <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid coupon code and discount amount.' });
      return;
    }
    if (!Number.isInteger(usageLimit) || usageLimit < 1) {
      setMessage({ type: 'error', text: 'Usage limit must be at least 1.' });
      return;
    }

    setSaving(true);
    try {
      await axios.post('/api/auth/coupons', {
        code: form.code.trim(),
        amount,
        usageLimit
      }, authConfig());
      setMessage({ type: 'success', text: 'Coupon created successfully.' });
      setForm({ code: '', amount: '', usageLimit: '1' });
      await fetchCoupons();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not create coupon. Check the code and try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async id => {
    setMessage({ type: '', text: '' });
    try {
      await axios.patch(`/api/auth/coupons/${id}/deactivate`, {}, authConfig());
      setMessage({ type: 'success', text: 'Coupon deactivated.' });
      await fetchCoupons();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not deactivate this coupon.' });
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this coupon permanently? This action cannot be undone.')) return;
    setMessage({ type: '', text: '' });
    try {
      await axios.delete(`/api/auth/coupons/${id}`, authConfig());
      setMessage({ type: 'success', text: 'Coupon deleted.' });
      await fetchCoupons();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not delete this coupon.' });
    }
  };

  const formatDate = value => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const StatCard = ({ label, value, hint, icon }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-700">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-1 pb-8 sm:px-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Finance & Billing</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Coupon management</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Create discount codes, monitor redemptions and manage coupon availability.</p>
        </div>
        <button type="button" onClick={fetchCoupons} disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto">
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total coupons" value={stats.total} hint="All created codes" icon="▤" />
        <StatCard label="Active" value={stats.active} hint="Available to customers" icon="✓" />
        <StatCard label="Inactive" value={stats.inactive} hint="Not available for use" icon="◌" />
        <StatCard label="Total redemptions" value={stats.redemptions} hint="Recorded coupon uses" icon="↗" />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-slate-900">Create a coupon</h2>
            <p className="text-sm text-slate-500">Set the discount value and maximum number of uses.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Coupon code</span>
            <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. WELCOME500" required maxLength={32}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Discount amount (₹)</span>
            <input name="amount" value={form.amount} onChange={handleChange} placeholder="e.g. 500" required type="number" min="1" step="1"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Usage limit</span>
            <input name="usageLimit" value={form.usageLimit} onChange={handleChange} placeholder="e.g. 100" required type="number" min="1" step="1"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            <span className="mt-1 block text-xs text-slate-400">Maximum total redemptions</span>
          </label>
          <button type="submit" disabled={saving}
            className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Creating…' : '+ Create coupon'}
          </button>
        </form>
        {message.text && (
          <div role="status" className={`mx-4 mb-4 rounded-xl border px-4 py-3 text-sm sm:mx-6 ${message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {message.text}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">All coupons</h2>
            <p className="mt-0.5 text-sm text-slate-500">{visibleCoupons.length} of {coupons.length} coupon{coupons.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search coupon code…"
              aria-label="Search coupon codes"
              className="min-w-0 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-56" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter coupons by status"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading coupons…</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <button type="button" onClick={fetchCoupons} className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Try again</button>
          </div>
        ) : visibleCoupons.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">%</div>
            <p className="mt-3 text-sm font-semibold text-slate-800">{coupons.length ? 'No matching coupons' : 'No coupons created yet'}</p>
            <p className="mt-1 text-sm text-slate-500">{coupons.length ? 'Try another search or status filter.' : 'Create your first coupon using the form above.'}</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Coupon</th>
                    <th className="px-6 py-3 font-semibold">Discount</th>
                    <th className="px-6 py-3 font-semibold">Redemptions</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Created</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleCoupons.map(coupon => (
                    <tr key={coupon._id} className="transition hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-1.5 font-mono font-bold tracking-wide text-blue-800">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">₹{Number(coupon.amount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 text-slate-700"><span className="font-semibold">{coupon.usedCount || 0}</span><span className="text-slate-400"> / {coupon.usageLimit ?? 1}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{coupon.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(coupon.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleDeactivate(coupon._id)} disabled={!coupon.active}
                            className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40">Deactivate</button>
                          <button type="button" onClick={() => handleDelete(coupon._id)}
                            className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 p-3 md:hidden">
              {visibleCoupons.map(coupon => (
                <article key={coupon._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex max-w-full break-all rounded-lg border border-dashed border-blue-300 bg-blue-50 px-3 py-1.5 font-mono text-sm font-bold tracking-wide text-blue-800">{coupon.code}</span>
                      <p className="mt-2 text-lg font-bold text-slate-900">₹{Number(coupon.amount || 0).toLocaleString('en-IN')} <span className="text-xs font-medium text-slate-500">discount</span></p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${coupon.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{coupon.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
                    <div><p className="text-xs text-slate-500">Redemptions</p><p className="mt-0.5 font-semibold text-slate-800">{coupon.usedCount || 0} / {coupon.usageLimit ?? 1}</p></div>
                    <div><p className="text-xs text-slate-500">Created</p><p className="mt-0.5 font-semibold text-slate-800">{formatDate(coupon.createdAt)}</p></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => handleDeactivate(coupon._id)} disabled={!coupon.active}
                      className="flex-1 rounded-lg border border-amber-200 px-3 py-2.5 text-xs font-semibold text-amber-700 disabled:opacity-40">Deactivate</button>
                    <button type="button" onClick={() => handleDelete(coupon._id)}
                      className="flex-1 rounded-lg border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-700">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminCoupons;
