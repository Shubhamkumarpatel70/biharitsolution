import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const EMPTY = { name: '', upiId: '', description: '', paymentType: 'UPI', order: 0, accountName: '', accountNumber: '', ifscCode: '', bankName: '', branch: '', qrCode: '', isActive: true };

export default function AdminPaymentOptions() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/auth/admin/payment-options');
      setItems(r.data.paymentOptions || []);
      setNotice({ type: '', text: '' });
    } catch (e) { setNotice({ type: 'error', text: e.response?.data?.message || 'Unable to load payment methods.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const change = e => setForm(p => ({ ...p, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const reset = () => { setForm(EMPTY); setEditingId(null); };
  const pickQr = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotice({ type: 'error', text: 'Upload a PNG, JPG or WebP QR image.' }); e.target.value = ''; return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'QR image must be 2 MB or smaller.' }); e.target.value = ''; return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(p => ({ ...p, qrCode: String(reader.result || '') }));
    reader.onerror = () => setNotice({ type: 'error', text: 'Could not read QR image.' });
    reader.readAsDataURL(file);
  };
  const submit = async e => {
    e.preventDefault(); setSaving(true); setNotice({ type: '', text: '' });
    try {
      if (form.paymentType === 'UPI' && !form.upiId.trim()) throw new Error('UPI ID is required.');
      if (form.paymentType === 'BANK_TRANSFER' && (!form.accountName.trim() || !form.accountNumber.trim() || !form.ifscCode.trim() || !form.bankName.trim())) throw new Error('Fill account name, account number, bank name and IFSC.');
      const payload = { ...form, order: Number(form.order) || 0 };
      if (editingId) await axios.put(`/api/auth/admin/payment-options/${editingId}`, payload);
      else await axios.post('/api/auth/admin/payment-options', payload);
      setNotice({ type: 'success', text: editingId ? 'Payment method updated.' : 'Payment method added.' });
      reset(); await load();
    } catch (e) { setNotice({ type: 'error', text: e.response?.data?.message || e.message || 'Could not save payment method.' }); }
    finally { setSaving(false); }
  };
  const edit = item => {
    setForm({ ...EMPTY, ...item, qrCode: item.qrCode || '' });
    setEditingId(item._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const remove = async id => {
    if (!window.confirm('Delete this payment method? Existing printed agreements will not change.')) return;
    try { await axios.delete(`/api/auth/admin/payment-options/${id}`); setNotice({ type: 'success', text: 'Payment method deleted.' }); await load(); }
    catch (e) { setNotice({ type: 'error', text: e.response?.data?.message || 'Could not delete payment method.' }); }
  };
  const toggle = async item => {
    try { await axios.put(`/api/auth/admin/payment-options/${item._id}`, { ...item, isActive: !item.isActive }); await load(); }
    catch (e) { setNotice({ type: 'error', text: e.response?.data?.message || 'Could not update status.' }); }
  };
  const field = 'w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
  const label = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600';
  const needsBank = form.paymentType === 'BANK_TRANSFER';

  return <div className="mx-auto w-full max-w-6xl space-y-6 px-3 pb-24 sm:px-5 lg:px-6">
    <header className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white shadow-lg sm:p-7">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-300">Admin · Finance Settings</p>
      <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Payment Options Management</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Manage bank transfers, UPI IDs and scan-to-pay QR codes. Active methods are automatically included in newly generated agreements and invoices.</p>
      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full bg-white/10 px-3 py-1.5">{items.length} saved methods</span>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-200">{items.filter(x => x.isActive).length} active</span>
      </div>
    </header>

    {notice.text && <div role="status" className={`rounded-xl border px-4 py-3 text-sm font-semibold ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{notice.text}</div>}

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="text-lg font-extrabold text-slate-900">{editingId ? 'Edit payment method' : 'Add agreement payment method'}</h2><p className="mt-1 text-sm text-slate-500">Choose a method and enter only the details needed for it.</p></div>
        {editingId && <button type="button" onClick={reset} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>}
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label><span className={label}>Display name *</span><input className={field} name="name" value={form.name} onChange={change} placeholder="e.g. ASKC Bank Account" required /></label>
          <label><span className={label}>Payment type *</span><select className={field} name="paymentType" value={form.paymentType} onChange={change}><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="WALLET">Wallet / Other</option></select></label>
          <label><span className={label}>Display order</span><input className={field} type="number" name="order" value={form.order} onChange={change} min="0" /></label>
          {form.paymentType !== 'BANK_TRANSFER' && <label><span className={label}>UPI ID {form.paymentType === 'UPI' ? '*' : ''}</span><input className={field} name="upiId" value={form.upiId} onChange={change} placeholder="business@upi" required={form.paymentType === 'UPI'} /></label>}
          {needsBank && <>
            <label><span className={label}>Account holder name *</span><input className={field} name="accountName" value={form.accountName} onChange={change} placeholder="Account holder / business name" required /></label>
            <label><span className={label}>Account number *</span><input className={field} name="accountNumber" value={form.accountNumber} onChange={change} inputMode="numeric" placeholder="Bank account number" required /></label>
            <label><span className={label}>Bank name *</span><input className={field} name="bankName" value={form.bankName} onChange={change} placeholder="Bank name" required /></label>
            <label><span className={label}>IFSC code *</span><input className={field} name="ifscCode" value={form.ifscCode} onChange={change} placeholder="ABCD0123456" required /></label>
            <label><span className={label}>Branch</span><input className={field} name="branch" value={form.branch} onChange={change} placeholder="Branch (optional)" /></label>
          </>}
          <label className="sm:col-span-2 lg:col-span-3"><span className={label}>Description / payment instructions</span><textarea className={field} name="description" rows="2" value={form.description} onChange={change} placeholder="Optional instructions shown to the client" /></label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
          <label><span className={label}>Scan to pay · QR image</span><input className={field} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickQr} /><span className="mt-1 block text-xs text-slate-500">PNG, JPG or WebP · maximum 2 MB</span></label>
          {form.qrCode && <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><img src={form.qrCode} alt="Payment QR preview" className="h-20 w-20 rounded-lg border border-slate-200 object-contain" /><button type="button" onClick={() => setForm(p => ({ ...p, qrCode: '' }))} className="text-xs font-bold text-red-600">Remove QR</button></div>}
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"><input type="checkbox" name="isActive" checked={!!form.isActive} onChange={change} className="h-4 w-4 accent-indigo-600" /> Show this payment method in newly generated agreements</label>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {editingId && <button type="button" onClick={reset} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel edit</button>}
          <button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Update payment method' : 'Save payment method'}</button>
        </div>
      </form>
    </section>

    <section className="space-y-3">
      <div><h2 className="text-lg font-extrabold text-slate-900">Saved payment methods</h2><p className="text-sm text-slate-500">Only active methods appear in new agreement documents.</p></div>
      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading payment methods…</div> : items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-bold text-slate-700">No payment methods configured</p><p className="mt-1 text-sm text-slate-500">Add your bank details, UPI ID or QR code above.</p></div> : <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {items.map(item => <article key={item._id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-extrabold text-slate-900">{item.name}</h3><p className="mt-1 text-xs font-semibold text-indigo-700">{item.paymentType === 'BANK_TRANSFER' ? 'Bank transfer' : item.paymentType}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></div>
          <div className="mt-4 flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1 space-y-1.5 text-sm text-slate-600">
              {item.upiId && item.paymentType !== 'BANK_TRANSFER' && <p className="break-all"><b className="text-slate-800">UPI:</b> {item.upiId}</p>}
              {item.accountName && <p><b className="text-slate-800">Account:</b> {item.accountName}</p>}
              {item.accountNumber && <p className="break-all"><b className="text-slate-800">A/C No:</b> {item.accountNumber}</p>}
              {item.bankName && <p><b className="text-slate-800">Bank:</b> {item.bankName} {item.branch ? `· ${item.branch}` : ''}</p>}
              {item.ifscCode && <p><b className="text-slate-800">IFSC:</b> {item.ifscCode}</p>}
              {item.description && <p className="break-words text-xs text-slate-500">{item.description}</p>}
            </div>
            {item.qrCode && <img src={item.qrCode} alt="Payment QR" className="h-24 w-24 rounded-lg border border-slate-200 object-contain p-1" />}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            <button onClick={() => toggle(item)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">{item.isActive ? 'Disable' : 'Enable'}</button>
            <button onClick={() => edit(item)} className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100">Edit</button>
            <button onClick={() => remove(item._id)} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100">Delete</button>
          </div>
        </article>)}
      </div>}
    </section>
  </div>;
}
