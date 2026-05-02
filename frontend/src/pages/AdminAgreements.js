import React, { useState, useEffect, useCallback } from 'react';
import axios from '../axios';
import { generateTemplate, DOCUMENT_TYPES } from './agreementTemplates';
import { Icon } from '../components/icons';

const STATUS_COLORS = {
  draft:    { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  sent:     { bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500' },
  signed:   { bg: 'bg-green-50',  text: 'text-green-700', dot: 'bg-green-500' },
  archived: { bg: 'bg-amber-50',  text: 'text-amber-700', dot: 'bg-amber-500' },
};

const DOC_ICONS = {
  nda: '🔒', quotation: '📋', invoice: '🧾',
  welcome: '👋', handover: '📦', change_request: '🔄', questionnaire: '📝',
};

const initForm = {
  clientName: '', clientEmail: '', clientCompany: '',
  documentType: 'nda', projectDesc: '', amount: '', notes: '',
};

export default function AdminAgreements() {
  const [view, setView]               = useState('clients'); // 'clients' | 'folder'
  const [clients, setClients]         = useState([]);
  const [folderDocs, setFolderDocs]   = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [sendingEmail, setSendingEmail] = useState(null); // stores doc._id being emailed
  const [stampModal, setStampModal]   = useState(null);  // doc metadata for stamp picker
  const [showGen, setShowGen]         = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [form, setForm]               = useState(initForm);
  const [toast, setToast]             = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load client list ──────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const r = await axios.get('/api/auth/admin/agreements-clients', { headers });
      setClients(r.data.clients || []);
    } catch { showToast('Failed to load clients', 'error'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  // ── Load docs for a client ────────────────────────────────────────
  const loadFolder = useCallback(async (clientName) => {
    setLoading(true);
    try {
      const r = await axios.get(
        `/api/auth/admin/agreements/client/${encodeURIComponent(clientName)}`,
        { headers }
      );
      setFolderDocs(r.data.agreements || []);
    } catch { showToast('Failed to load documents', 'error'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { loadClients(); }, [loadClients]);

  const openFolder = (client) => {
    setActiveClient(client);
    setView('folder');
    loadFolder(client.clientName);
  };

  const backToClients = () => {
    setView('clients');
    setActiveClient(null);
    setFolderDocs([]);
    loadClients();
  };

  // ── Generate & Save ───────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.clientName.trim()) return showToast('Client name is required', 'error');
    setSaving(true);
    try {
      const html = generateTemplate(form.documentType, {
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientCompany: form.clientCompany,
        projectDesc: form.projectDesc,
        amount: form.amount,
      });
      const docLabel = DOCUMENT_TYPES.find(d => d.id === form.documentType)?.label || form.documentType;
      await axios.post('/api/auth/admin/agreements', {
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        clientCompany: form.clientCompany.trim(),
        documentType: form.documentType,
        documentTitle: `${docLabel} — ${form.clientName.trim()}`,
        htmlContent: html,
        notes: form.notes,
      }, { headers });
      showToast('Document saved successfully!');
      setShowGen(false);
      setForm(initForm);
      // Refresh view
      if (view === 'folder' && activeClient) {
        loadFolder(activeClient.clientName);
      } else {
        loadClients();
        // If the doc was for the same client in folder view, reopen
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save document', 'error');
    } finally { setSaving(false); }
  };

  // ── View Document (opens new tab) ────────────────────────────────
  const openDocument = async (id, addStamp = false, stampText = 'APPROVED') => {
    setViewLoading(true);
    try {
      const r = await axios.get(`/api/auth/admin/agreements/${id}`, { headers });
      let html = r.data.agreement.htmlContent;
      if (addStamp) {
        const stampColors = {
          APPROVED:  { border: '#16a34a', text: '#16a34a' },
          SIGNED:    { border: '#2563eb', text: '#2563eb' },
          VERIFIED:  { border: '#7c3aed', text: '#7c3aed' },
          PAID:      { border: '#0891b2', text: '#0891b2' },
          CANCELLED: { border: '#dc2626', text: '#dc2626' },
        };
        const c = stampColors[stampText] || stampColors.APPROVED;
        const stampHtml = `
          <style>
            #askc-stamp {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-22deg);
              font-family: 'Arial Black', sans-serif;
              font-size: 64px;
              font-weight: 900;
              color: ${c.text};
              opacity: 0.22;
              border: 10px solid ${c.border};
              border-radius: 12px;
              padding: 16px 40px;
              text-transform: uppercase;
              letter-spacing: 6px;
              pointer-events: none;
              z-index: 99999;
              user-select: none;
            }
            @media print { #askc-stamp { position: fixed !important; opacity: 0.20 !important; } }
          </style>
          <div id="askc-stamp">${stampText}</div>
        `;
        // Inject before </body>
        html = html.replace('</body>', stampHtml + '</body>');
      }
      const w = window.open('', '_blank');
      w.document.write(html);
      w.document.close();
    } catch { showToast('Failed to load document', 'error'); }
    finally { setViewLoading(false); setStampModal(null); }
  };

  const handleView = (doc) => {
    // Show stamp picker modal first
    setStampModal(doc);
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/auth/admin/agreements/${id}`, { headers });
      showToast('Document deleted');
      if (activeClient) loadFolder(activeClient.clientName);
      else loadClients();
    } catch { showToast('Failed to delete', 'error'); }
  };

  // ── Send Email ────────────────────────────────────────────────────
  const handleSendEmail = async (doc) => {
    if (!doc.clientEmail) {
      showToast('No client email on file. Edit the document to add one.', 'error');
      return;
    }
    if (!window.confirm(`Send "${doc.documentTitle}" to ${doc.clientEmail}?`)) return;
    setSendingEmail(doc._id);
    try {
      const r = await axios.post(
        `/api/auth/admin/agreements/${doc._id}/send-email`,
        {},
        { headers }
      );
      showToast(r.data.message || 'Email sent!');
      // Refresh docs so status shows "sent"
      if (activeClient) loadFolder(activeClient.clientName);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to send email', 'error');
    } finally {
      setSendingEmail(null);
    }
  };

  // ── Status update ─────────────────────────────────────────────────
  const handleStatus = async (id, status) => {
    try {
      await axios.patch(`/api/auth/admin/agreements/${id}/status`, { status }, { headers });
      showToast('Status updated');
      if (activeClient) loadFolder(activeClient.clientName);
    } catch { showToast('Failed to update status', 'error'); }
  };

  // ── Print is now handled inside the new tab ───────────────────────

  // ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[999] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            {view === 'folder' && (
              <button onClick={backToClients} className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm font-semibold mb-3 transition-colors">
                <Icon name="chevron" className="w-4 h-4 rotate-90" /> All Clients
              </button>
            )}
            <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-1">Legal & Compliance</p>
            <h1 className="text-2xl md:text-3xl font-bold">
              {view === 'folder' ? (
                <span className="flex items-center gap-3">
                  <span className="text-4xl">📁</span>
                  {activeClient?.clientName}
                </span>
              ) : 'Agreements & Documents'}
            </h1>
            {view === 'folder' && activeClient?.clientCompany && (
              <p className="text-slate-300 text-sm mt-1">{activeClient.clientCompany}</p>
            )}
          </div>
          <button
            onClick={() => {
              setForm(view === 'folder' ? { ...initForm, clientName: activeClient?.clientName || '' } : initForm);
              setShowGen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow"
          >
            <Icon name="plus" className="w-4 h-4" /> Generate Document
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      )}

      {/* CLIENT GRID */}
      {!loading && view === 'clients' && (
        <>
          {clients.length === 0 ? (
            <EmptyState onGenerate={() => setShowGen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clients.map(c => (
                <button
                  key={c._id}
                  onClick={() => openFolder(c)}
                  className="group text-left bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">📁</div>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-100">
                      {c.count} doc{c.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">{c.clientName}</h3>
                  {c.clientCompany && <p className="text-sm text-slate-500 mb-3">{c.clientCompany}</p>}
                  {c.clientEmail && <p className="text-xs text-slate-400">✉ {c.clientEmail}</p>}
                  <p className="text-xs text-slate-400 mt-2">Last activity: {new Date(c.lastActivity).toLocaleDateString('en-IN')}</p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* FOLDER VIEW — Document List */}
      {!loading && view === 'folder' && (
        <>
          {folderDocs.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-5xl mb-4">📄</p>
              <p className="font-semibold">No documents yet for this client.</p>
              <button onClick={() => setShowGen(true)} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">Generate First Document</button>
            </div>
          ) : (
            <div className="space-y-3">
              {folderDocs.map(doc => {
                const sc = STATUS_COLORS[doc.status] || STATUS_COLORS.draft;
                return (
                  <div key={doc._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4 flex-wrap">
                    <div className="text-3xl">{DOC_ICONS[doc.documentType] || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{doc.documentTitle}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    {/* Status badge + changer */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {doc.status}
                      </span>
                      <select
                        value={doc.status}
                        onChange={e => handleStatus(doc._id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      >
                        {['draft','sent','signed','archived'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                      </select>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendEmail(doc)}
                        disabled={sendingEmail === doc._id}
                        title={doc.clientEmail ? `Send to ${doc.clientEmail}` : 'No client email — set one when generating'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-50
                          ${doc.clientEmail
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                      >
                        {sendingEmail === doc._id
                          ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <span>✉</span>
                        }
                        {sendingEmail === doc._id ? 'Sending…' : 'Send Email'}
                      </button>
                      <button
                        onClick={() => handleView(doc)}
                        disabled={viewLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        <Icon name="eye" className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Icon name="close" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── GENERATE MODAL ───────────────────────────── */}
      {showGen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Generate Document</h2>
              <button onClick={() => setShowGen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <Icon name="close" className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Document Type *</label>
                <select
                  value={form.documentType}
                  onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                >
                  {DOCUMENT_TYPES.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client Name *</label>
                  <input
                    required
                    value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="Shubham Kumar"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input
                    value={form.clientCompany}
                    onChange={e => setForm(f => ({ ...f, clientCompany: e.target.value }))}
                    placeholder="ACME Corp"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client Email</label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="client@example.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                />
              </div>
              {['quotation','handover','change_request'].includes(form.documentType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Project Description</label>
                  <textarea
                    rows={3}
                    value={form.projectDesc}
                    onChange={e => setForm(f => ({ ...f, projectDesc: e.target.value }))}
                    placeholder="Describe the project scope..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50 resize-none"
                  />
                </div>
              )}
              {['quotation','invoice'].includes(form.documentType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="50000"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Internal Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional internal note..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Generate & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── STAMP PICKER MODAL ───────────────────────── */}
      {stampModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-slate-900 px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">Document Viewer</p>
                <h3 className="text-white font-bold text-lg leading-tight truncate">{DOC_ICONS[stampModal.documentType] || '📄'} {stampModal.documentTitle?.split('—')[0]?.trim()}</h3>
              </div>
              <button onClick={() => setStampModal(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <Icon name="close" className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Stamp Options */}
            <div className="p-6">
              <p className="text-sm font-bold text-slate-700 mb-4">Add a stamp to this document?</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'No Stamp',  value: null,        color: 'bg-slate-100 text-slate-600 border-slate-200' },
                  { label: '✅ APPROVED',  value: 'APPROVED',  color: 'bg-green-50 text-green-700 border-green-200' },
                  { label: '🖊 SIGNED',    value: 'SIGNED',    color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: '🔍 VERIFIED',  value: 'VERIFIED',  color: 'bg-violet-50 text-violet-700 border-violet-200' },
                  { label: '💰 PAID',      value: 'PAID',      color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                  { label: '❌ CANCELLED', value: 'CANCELLED', color: 'bg-red-50 text-red-700 border-red-200' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => openDocument(stampModal._id, !!opt.value, opt.value || 'APPROVED')}
                    disabled={viewLoading}
                    className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold text-left transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${opt.color}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 text-center">Document will open in a new tab. Use Ctrl+P to print.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onGenerate }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
      <p className="text-6xl mb-4">🗂️</p>
      <h2 className="text-xl font-bold text-slate-800 mb-2">No client agreements yet</h2>
      <p className="text-slate-500 text-sm mb-6">Generate your first document to create a client folder automatically.</p>
      <button onClick={onGenerate} className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
        <Icon name="plus" className="w-4 h-4" /> Generate Document
      </button>
    </div>
  );
}
