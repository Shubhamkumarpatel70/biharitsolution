import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        setError('Could not fetch stats.');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const cards = stats
    ? [
        { label: 'Total users', value: stats.userCount, icon: 'users', accent: 'bg-sky-50 text-sky-700 border-sky-100' },
        { label: 'Total subscriptions', value: stats.subCount, icon: 'clipboard', accent: 'bg-violet-50 text-violet-700 border-violet-100' },
        { label: 'Active subscriptions', value: stats.activeSubs, icon: 'check', accent: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        { label: 'Total revenue', value: `₹${Number(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: 'currency', accent: 'bg-amber-50 text-amber-800 border-amber-100' }
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Site Statistics</h2>
        <p className="text-sm text-slate-500 mt-1">Professional analytics snapshot for admin and co-admin operations.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading statistics...</div>
        ) : error ? (
          <div className="py-10 text-center text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <span className={`inline-flex p-2 rounded-lg border mb-3 ${card.accent}`}>
                  <Icon name={card.icon} className="w-5 h-5" strokeWidth={2} />
                </span>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{card.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats; 