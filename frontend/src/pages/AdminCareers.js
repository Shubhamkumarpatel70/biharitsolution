import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const defaultForm = {
  title: '',
  description: '',
  location: '',
  employmentType: 'Full-time',
  isActive: true,
};

function AdminCareers() {
  const [careers, setCareers] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/auth/admin/careers');
      setCareers(res.data.careers || []);
    } catch {
      setMessage('Could not load careers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await axios.put(`/api/auth/admin/careers/${editingId}`, form);
        setMessage('Career updated.');
      } else {
        await axios.post('/api/auth/admin/careers', form);
        setMessage('Career posted.');
      }
      setForm(defaultForm);
      setEditingId(null);
      fetchCareers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Save failed.');
    }
  };

  const handleEdit = (c) => {
    setEditingId(c._id);
    setForm({
      title: c.title,
      description: c.description,
      location: c.location || '',
      employmentType: c.employmentType || 'Full-time',
      isActive: c.isActive !== false,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this role and all its applications?')) return;
    setMessage('');
    try {
      await axios.delete(`/api/auth/admin/careers/${id}`);
      setMessage('Deleted.');
      if (editingId === id) {
        setEditingId(null);
        setForm(defaultForm);
      }
      fetchCareers();
    } catch {
      setMessage('Could not delete.');
    }
  };

  const toggleActive = async (c) => {
    try {
      await axios.put(`/api/auth/admin/careers/${c._id}`, {
        title: c.title,
        description: c.description,
        location: c.location || '',
        employmentType: c.employmentType || 'Full-time',
        isActive: !c.isActive,
      });
      fetchCareers();
    } catch {}
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <Icon name="briefcase" className="w-5 h-5" />
          </span>
          Careers
        </h2>
        <p className="text-sm text-slate-500">Active listings appear on the public Careers page.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{message}</div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm mb-8 space-y-4"
      >
        <h3 className="font-semibold text-slate-800">{editingId ? 'Edit role' : 'New role'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Job title"
            required
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500/30"
          />
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location (e.g. Remote, Patna)"
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500/30"
          />
          <input
            name="employmentType"
            value={form.employmentType}
            onChange={handleChange}
            placeholder="Employment type"
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500/30"
          />
          <label className="flex items-center gap-2 text-sm text-slate-700 px-1">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
            Visible on careers page
          </label>
        </div>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Role description, requirements, benefits…"
          required
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:ring-2 focus:ring-primary-500/30"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700"
          >
            {editingId ? 'Update' : 'Publish'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(defaultForm);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="font-semibold text-slate-800 text-sm">All roles ({careers.length})</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : careers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No careers yet.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {careers.map((c) => (
              <li key={c._id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/80">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {[c.location, c.employmentType].filter(Boolean).join(' · ') || '—'}
                    {' · '}
                    <span className={c.isActive ? 'text-emerald-600' : 'text-amber-600'}>
                      {c.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    {c.isActive ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(c)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c._id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default AdminCareers;
