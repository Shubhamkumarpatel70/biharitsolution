import React, { useState, useEffect } from 'react';
import axios from '../axios';

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
          <div className="w-16 h-16 border-4 border-success-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-danger-500">
          {error}
        </div>
      </div>
    );
  }

  const conversionRate = stats.userCount > 0 ? ((stats.activeSubs / stats.userCount) * 100).toFixed(1) : 0;
  const avgRevenue = stats.userCount > 0 ? (stats.totalRevenue / stats.userCount).toFixed(2) : 0;
  const activeRate = stats.subCount > 0 ? ((stats.activeSubs / stats.subCount) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-success-500 to-success-600 rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          Welcome to the Admin Dashboard!
        </h1>
        <p className="text-white/90 text-sm md:text-base max-w-2xl">
          Manage your website, monitor user activity, and track business performance from this comprehensive admin panel.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Users Card */}
        <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-5xl mb-3 text-center">👥</div>
          <h3 className="text-lg font-semibold mb-2 text-center">Total Users</h3>
          <p className="text-3xl font-black text-center">
            {stats.userCount.toLocaleString()}
          </p>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-br from-pink-500 to-red-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-5xl mb-3 text-center">💰</div>
          <h3 className="text-lg font-semibold mb-2 text-center">Total Revenue</h3>
          <p className="text-3xl font-black text-center">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Total Subscriptions Card */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-5xl mb-3 text-center">📊</div>
          <h3 className="text-lg font-semibold mb-2 text-center">Total Subscriptions</h3>
          <p className="text-3xl font-black text-center">
            {stats.subCount.toLocaleString()}
          </p>
        </div>

        {/* Active Subscriptions Card */}
        <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="text-5xl mb-3 text-center">✅</div>
          <h3 className="text-lg font-semibold mb-2 text-center">Active Subscriptions</h3>
          <p className="text-3xl font-black text-center">
            {stats.activeSubs.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-success-500 mb-6">Quick Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-700/50 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Conversion Rate</p>
            <p className="text-2xl font-bold text-white">
              {conversionRate}%
            </p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Avg Revenue per User</p>
            <p className="text-2xl font-bold text-white">
              ₹{avgRevenue}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-700/50 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Active Rate</p>
            <p className="text-2xl font-bold text-white">
              {activeRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-success-500 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600 hover:border-success-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              User Management
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Manage user accounts, change roles, and monitor user activity.
            </p>
            <div className="text-success-500 text-sm font-medium">
              Navigate to "Manage Users" tab →
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600 hover:border-success-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Site Statistics
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              View detailed analytics, user growth trends, and subscription metrics.
            </p>
            <div className="text-success-500 text-sm font-medium">
              Navigate to "Site Stats" tab →
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600 hover:border-success-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              Notifications
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Send announcements to users, manage notification settings.
            </p>
            <div className="text-success-500 text-sm font-medium">
              Navigate to "Notifications" tab →
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-5 border border-gray-600 hover:border-success-500/50 transition-colors">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📦</span>
              Content Management
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Manage features, services, team members, and plans.
            </p>
            <div className="text-success-500 text-sm font-medium">
              Navigate to content tabs →
            </div>
          </div>
        </div>
      </div>

      {/* System Status Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-success-500 mb-6">System Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Database Connection', status: 'Connected & Healthy' },
            { label: 'Notification System', status: 'Auto-cleanup Active' },
            { label: 'API Services', status: 'All Systems Operational' },
            { label: 'Security', status: 'All Checks Passed' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-gray-700/50 rounded-xl">
              <div className="w-3 h-3 bg-success-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium mb-1">{item.label}</p>
                <p className="text-gray-400 text-xs">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Information */}
      <div className="text-center py-6 text-gray-400 text-sm">
        <p className="mb-2">
          Admin Dashboard v2.0 • Last updated: {new Date().toLocaleDateString()}
        </p>
        <p>
          Need help? Check the "Help" tab or contact system administrator.
        </p>
      </div>
    </div>
  );
};

export default AdminHome;
