import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AdminPromotionalUnsubscribed = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUnsubscribed = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/admin/newsletter-unsubscribed', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data?.subscribers || []);
    } catch (err) {
      setError('Could not fetch unsubscribed users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnsubscribed();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Promotional Email Unsubscribed</h2>
          <p className="text-sm text-slate-500 mt-1">Users who unsubscribed from promotional emails.</p>
        </div>
        <button
          type="button"
          onClick={fetchUnsubscribed}
          className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading unsubscribed users...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No unsubscribed users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Unsubscribed At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item._id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-3 text-slate-900 break-all">{item.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                        Unsubscribed
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPromotionalUnsubscribed;
