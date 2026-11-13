import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const emptyForm = {
  title: '', description: '', category: 'Web App', highlight: '',
  technologies: '', projectUrl: '', icon: 'briefcase', color: '#64748b',
  order: 0, isActive: true, image: null
};

function AdminProjects() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/admin/projects');
      setItems(Array.isArray(response.data?.projects) ? response.data.projects : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load projects.');
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

  const setField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const handleImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Project image must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }
    setError('');
    setField('image', file);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('description', form.description.trim());
    data.append('category', form.category.trim());
    data.append('highlight', form.highlight.trim());
    data.append('technologies', form.technologies);
    data.append('projectUrl', form.projectUrl.trim());
    data.append('icon', form.icon.trim() || 'briefcase');
    data.append('color', form.color);
    data.append('order', String(form.order));
    data.append('isActive', String(form.isActive));
    if (form.image) data.append('image', form.image);

    try {
      setSaving(true);
      if (editing) {
        await axios.put(`/api/auth/admin/projects/${editing._id}`, data);
        setSuccess('Project updated successfully.');
      } else {
        await axios.post('/api/auth/admin/projects', data);
        setSuccess('Project added successfully.');
      }
      resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save this project.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = item => {
    setEditing(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Web App',
      highlight: item.highlight || '',
      technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : '',
      projectUrl: item.projectUrl || '',
      icon: item.icon || 'briefcase',
      color: item.color || '#64748b',
      order: item.order || 0,
      isActive: item.isActive !== false,
      image: null
    });
    setPreview(item.image || '');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = async item => {
    if (!window.confirm(`Delete "${item.title}" from Latest Projects?`)) return;
    try {
      await axios.delete(`/api/auth/admin/projects/${item._id}`);
      setSuccess('Project deleted successfully.');
      if (editing?._id === item._id) resetForm();
      await fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete this project.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Website content</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Latest Projects</h2>
          <p className="mt-1 text-sm text-slate-500">Add and manage the projects displayed on the homepage. Active projects appear automatically.</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> {items.length} {items.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Edit project' : 'Add a project'}</h3>
            <p className="mt-1 text-sm text-slate-500">Title and description are required. Project image is optional.</p>
          </div>
          {editing && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel edit</button>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Project title *</span>
            <input required maxLength={140} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Business Management Platform" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description *</span>
            <textarea required rows={3} maxLength={1200} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="What does this project do?" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Category</span>
            <input maxLength={80} value={form.category} onChange={e => setField('category', e.target.value)} placeholder="Web App, E-commerce, SaaS…" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Highlight (optional)</span>
            <input maxLength={160} value={form.highlight} onChange={e => setField('highlight', e.target.value)} placeholder="e.g. Payments and inventory" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Technologies</span>
            <input value={form.technologies} onChange={e => setField('technologies', e.target.value)} placeholder="React, Node.js, MongoDB (comma separated)" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Project URL (optional)</span>
            <input type="url" value={form.projectUrl} onChange={e => setField('projectUrl', e.target.value)} placeholder="https://example.com" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Fallback icon</span>
            <input value={form.icon} onChange={e => setField('icon', e.target.value)} placeholder="briefcase" className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Accent colour</span>
            <div className="flex gap-2">
              <input type="color" value={form.color} onChange={e => setField('color', e.target.value)} className="h-11 w-14 rounded-lg border border-slate-300 bg-white p-1" />
              <input value={form.color} onChange={e => setField('color', e.target.value)} pattern="^#[0-9a-fA-F]{6}$" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Project image (optional)</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleImage} className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white" />
            <span className="mt-1.5 block text-xs text-slate-500">PNG, JPG, WEBP or SVG · Maximum 5 MB. Leave empty while editing to keep the current image.</span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">Display order</span>
            <input type="number" min="0" value={form.order} onChange={e => setField('order', e.target.value)} className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-slate-500" />
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} className="h-4 w-4 rounded border-slate-300" /> Show on homepage
          </label>
        </div>

        {preview && <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><img src={preview} alt="Project preview" className="h-20 w-28 rounded-lg object-cover" /><span className="text-sm font-semibold text-slate-700">{form.title || 'Project image preview'}</span></div>}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          {editing && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>}
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add project'}</button>
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div><h3 className="text-lg font-bold text-slate-900">Saved projects</h3><p className="mt-1 text-sm text-slate-500">Manage projects shown on the public homepage.</p></div>
          <button type="button" onClick={fetchItems} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Refresh projects"><Icon name="refresh" className="h-4 w-4" /></button>
        </div>
        {loading ? <div className="py-12 text-center text-sm text-slate-500">Loading projects…</div> : items.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(item => (
              <article key={item._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <Icon name={item.icon || 'briefcase'} className="h-7 w-7 text-slate-500" />}</div>
                <div className="min-w-0 flex-1"><h4 className="truncate text-sm font-bold text-slate-800">{item.title}</h4><p className="mt-1 truncate text-xs text-slate-500">{item.category} · Order: {item.order || 0}</p><p className="mt-1 text-xs text-slate-500">{item.isActive ? 'Visible' : 'Hidden'}</p></div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" onClick={() => startEdit(item)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label={`Edit ${item.title}`}><Icon name="pen" className="h-4 w-4" /></button>
                  <button type="button" onClick={() => removeItem(item)} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${item.title}`}><Icon name="close" className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        ) : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center"><p className="font-semibold text-slate-700">No projects added yet</p><p className="mt-1 text-sm text-slate-500">Use the form above to add your first project.</p></div>}
      </section>
    </div>
  );
}

export default AdminProjects;
