import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const emptyForm = { name: '', websiteUrl: '', order: 0, isActive: true, logo: null };

function AdminClientWork() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/admin/client-work');
      setItems(Array.isArray(response.data?.clientWork) ? response.data.clientWork : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load client work. Please check your admin access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setPreview('');
  };

  const handleLogo = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setForm(current => ({ ...current, logo: file }));
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!editing && !form.logo) {
      setError('Please upload a client logo.');
      return;
    }
    const data = new FormData();
    data.append('name', form.name.trim());
    data.append('websiteUrl', form.websiteUrl.trim());
    data.append('order', String(form.order));
    data.append('isActive', String(form.isActive));
    if (form.logo) data.append('logo', form.logo);

    try {
      setSaving(true);
      if (editing) {
        await axios.put(`/api/auth/admin/client-work/${editing._id}`, data);
        setSuccess('Client work updated successfully.');
      } else {
        await axios.post('/api/auth/admin/client-work', data);
        setSuccess('Client work added successfully.');
      }
      resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this client work item.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = item => {
    setEditing(item);
    setForm({ name: item.name || '', websiteUrl: item.websiteUrl || '', order: item.order || 0, isActive: item.isActive !== false, logo: null });
    setPreview(item.logo || '');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async item => {
    if (!window.confirm(`Delete "${item.name}" from client work?`)) return;
    try {
      await axios.delete(`/api/auth/admin/client-work/${item._id}`);
      setSuccess('Client work deleted successfully.');
      if (editing?._id === item._id) resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this client work item.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Website content</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Client Work</h2>
          <p className="mt-1 text-sm text-slate-500">Add client or website names and logos. Active entries appear on the homepage automatically.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit client work' : 'Add client work'}</h3>
            <p className="mt-1 text-sm text-slate-500">Name and logo are required for a new entry.</p>
          </div>
          {editing && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel edit</button>}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Client / website name *</span>
              <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} required maxLength={120} placeholder="e.g. Client Business or Website Name" className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Website URL <span className="font-normal text-slate-400">(optional)</span></span>
              <input type="url" value={form.websiteUrl} onChange={e => setForm(v => ({ ...v, websiteUrl: e.target.value }))} placeholder="https://example.com" className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Display order</span>
              <input type="number" min="0" value={form.order} onChange={e => setForm(v => ({ ...v, order: e.target.value }))} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            </label>
            <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(v => ({ ...v, isActive: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
              Show on homepage
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Client logo {!editing && '*'}</span>
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" onChange={handleLogo} required={!editing} className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
              <span className="mt-1.5 block text-xs text-slate-500">PNG, JPG, WEBP, SVG or GIF · Maximum 5 MB. Leave empty while editing to keep the current logo.</span>
            </label>
          </div>

          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <span className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Logo preview</span>
            {preview ? <img src={preview} alt="Selected client logo preview" className="max-h-28 max-w-full object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm"><Icon name="document" className="h-7 w-7" /></div>}
            <span className="mt-3 max-w-full truncate text-sm font-semibold text-slate-700">{form.name || 'Client name'}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          {editing && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Add client work'}
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><h3 className="text-lg font-bold text-slate-900">Saved client work</h3><p className="mt-1 text-sm text-slate-500">Manage the logos displayed on the public homepage.</p></div>
          <button type="button" onClick={fetchItems} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Refresh client work"><Icon name="refresh" className="h-4 w-4" /></button>
        </div>
        {loading ? <div className="py-12 text-center text-sm text-slate-500">Loading client work…</div> : items.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(item => (
              <article key={item._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-2"><img src={item.logo} alt="" className="max-h-full max-w-full object-contain" /></div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-bold text-slate-800">{item.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">Order: {item.order || 0} · {item.isActive ? 'Visible' : 'Hidden'}</p>
                  {item.websiteUrl && <p className="mt-1 truncate text-xs text-slate-400">{item.websiteUrl}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={`Edit ${item.name}`}><Icon name="pen" className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeItem(item)} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${item.name}`}><Icon name="close" className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center"><p className="font-semibold text-slate-700">No client work added yet</p><p className="mt-1 text-sm text-slate-500">Use the form above to add your first client logo.</p></div>}
      </section>
    </div>
  );
}

export default AdminClientWork;
