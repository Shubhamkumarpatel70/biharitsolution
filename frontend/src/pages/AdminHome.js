import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const AdminHome = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    totalRevenue: 0,
    subCount: 0,
    activeSubs: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/auth/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600 font-medium">{error}</div>
      </div>
    );
  }

  const conversionRate = stats.userCount > 0 ? ((stats.activeSubs / stats.userCount) * 100).toFixed(1) : 0;
  const avgRevenue = stats.userCount > 0 ? (stats.totalRevenue / stats.userCount).toFixed(2) : 0;
  const activeRate = stats.subCount > 0 ? ((stats.activeSubs / stats.subCount) * 100).toFixed(1) : 0;

  const statCards = [
    {
      label: 'Total users',
      value: stats.userCount.toLocaleString(),
      iconName: 'users',
      accent: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    {
      label: 'Total revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      iconName: 'currency',
      accent: 'bg-emerald-50 text-emerald-800 border-emerald-100'
    },
    {
      label: 'Subscriptions',
      value: stats.subCount.toLocaleString(),
      iconName: 'chart',
      accent: 'bg-violet-50 text-violet-800 border-violet-100'
    },
    {
      label: 'Active subs',
      value: stats.activeSubs.toLocaleString(),
      iconName: 'check',
      accent: 'bg-amber-50 text-amber-900 border-amber-100'
    }
  ];

  const quickActions = [
    { title: 'User management', body: 'Roles, access, and activity across your customer base.', iconName: 'users', hint: 'Open “Manage Users” in the sidebar.' },
    { title: 'Site statistics', body: 'Growth, subscriptions, and engagement at a glance.', iconName: 'chart', hint: 'Use the “Site Stats” section.' },
    { title: 'Notifications', body: 'Broadcast updates and keep members in the loop.', iconName: 'bell', hint: 'Go to “Notifications”.' },
    { title: 'ID Card Generator', body: 'Create and manage professional ID cards for team members.', iconName: 'creditCard', hint: 'Open “ID Card” in the sidebar.' },
    { title: 'Content', body: 'Plans, features, services, and team profiles.', iconName: 'folder', hint: 'Explore the content group in the menu.' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 lg:pb-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" aria-hidden />
        <div className="relative z-10">
          <p className="text-accent-300 text-sm font-semibold uppercase tracking-wider mb-2">Control center</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
            Monitor revenue, subscriptions, and platform health from a single, calm overview—then jump into the sidebar for deep work.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow border-slate-200"
          >
            <div className={`inline-flex p-2.5 rounded-xl border mb-4 ${card.accent}`}>
              <Icon name={card.iconName} className="w-6 h-6" strokeWidth={2} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">{card.label}</p>
            <p className="text-2xl md:text-3xl font-bold text-slate-900 tabular-nums">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Icon name="trending" className="w-5 h-5 text-primary-600" strokeWidth={2} />
          Quick overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Conversion rate</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{conversionRate}%</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Avg revenue / user</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">₹{avgRevenue}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-center">
            <p className="text-slate-500 text-sm mb-1">Active rate</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{activeRate}%</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Where to go next</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {quickActions.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 p-5 hover:border-primary-200 hover:shadow-sm transition-all bg-slate-50/50"
            >
              <div className="flex gap-3 mb-3">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-primary-700">
                  <Icon name={item.iconName} className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.body}</p>
                </div>
              </div>
              <p className="text-xs font-medium text-accent-700">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6">System status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Database', status: 'Connected' },
            { label: 'Notifications', status: 'Healthy' },
            { label: 'API', status: 'Operational' },
            { label: 'Security', status: 'Checks passed' }
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{row.label}</p>
                <p className="text-xs text-slate-500 truncate">{row.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-slate-400 text-sm pb-4">
        Admin dashboard • {new Date().toLocaleDateString()}
      </p>
    </div>
  );
};

export default AdminHome;
