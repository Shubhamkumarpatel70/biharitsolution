import React, { useCallback, useEffect, useState } from "react";
import axios from "../axios";

const statuses = ["submitted", "in_review", "awaiting_user", "completed", "rejected"];
const PrivacyRequestsAdmin = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [drafts, setDrafts] = useState({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await axios.get("/api/auth/admin/privacy/requests", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setRequests(response.data.requests || []);
      setStats(response.data.stats || {});
      setDrafts(current => {
        const next = { ...current };
        (response.data.requests || []).forEach(item => {
          if (!Object.prototype.hasOwnProperty.call(next, item._id)) next[item._id] = { status: item.status, response: item.response || "", identityVerified: Boolean(item.identityVerifiedAt), decision: item.decision || "pending", resolutionAction: item.resolutionAction || "not_started", retentionReason: item.retentionReason || "", internalNotes: item.internalNotes || "" };
        });
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not load privacy requests.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateRequest = async id => {
    const draft = drafts[id];
    if (!draft) return;
    setSaving(id); setError(""); setNotice("");
    try {
      const response = await axios.patch(`/api/auth/admin/privacy/requests/${id}`, draft, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setRequests(items => items.map(item => item._id === id ? response.data.request : item));
      setNotice("Privacy request updated successfully.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update this request.");
    } finally { setSaving(""); }
  };

  const visible = filter === "all" ? requests : requests.filter(item => item.status === filter || item.type === filter);
  const metricCards = [
    ["Total requests", stats.total || 0],
    ["New requests", stats.submitted || 0],
    ["In review", stats.inReview || 0],
    ["Open erasure requests", stats.erasure || 0]
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="rounded-2xl bg-slate-900 p-6 sm:p-7 text-white"><p className="text-xs uppercase tracking-widest text-sky-300 font-semibold">Privacy operations</p><h2 className="text-2xl font-bold mt-2">DPDP & Privacy Requests</h2><p className="text-sm text-slate-300 mt-2">Review user requests, document decisions and maintain a status history.</p></div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">{metricCards.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold text-slate-900 mt-1">{value}</p></div>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"><div><h3 className="font-bold text-slate-900">Request inbox</h3><p className="text-xs text-slate-500 mt-1">Latest 500 requests</p></div><div className="flex gap-2"><select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"><option value="all">All requests</option><optgroup label="Status">{statuses.map(value => <option key={value} value={value}>{value.replace("_", " ")}</option>)}</optgroup><optgroup label="Request type"><option value="access">Access</option><option value="correction">Correction</option><option value="erasure">Erasure</option><option value="grievance">Grievance</option></optgroup></select><button onClick={load} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Refresh</button></div></div>
      {loading ? <div className="rounded-xl bg-white p-10 text-center text-slate-500">Loading privacy requests…</div> : visible.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No matching privacy requests.</div> : <div className="space-y-4">{visible.map(item => {
        const draft = drafts[item._id] || { status: item.status, response: item.response || "", identityVerified: Boolean(item.identityVerifiedAt), decision: item.decision || "pending", resolutionAction: item.resolutionAction || "not_started", retentionReason: item.retentionReason || "", internalNotes: item.internalNotes || "" };
        return <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold text-slate-900 capitalize">{item.type} request</h4><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{item.status.replace("_", " ")}</span></div><p className="text-sm text-slate-700 mt-2">{item.user?.name || "Unknown user"} · {item.user?.email || "No email"}</p><p className="text-xs text-slate-400 mt-1">Received {new Date(item.createdAt).toLocaleString("en-IN")} · Target response date {item.dueAt ? new Date(item.dueAt).toLocaleDateString("en-IN") : "Not set"} · Ref {item._id}</p></div></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">User details</p><p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{item.details}</p></div>
          {item.statusHistory?.length > 0 && <details className="text-xs text-slate-500"><summary className="cursor-pointer font-semibold">View status history ({item.statusHistory.length})</summary><ul className="mt-2 space-y-2">{item.statusHistory.map((entry, index) => <li key={entry._id || index} className="border-l-2 border-slate-200 pl-3"><b className="capitalize">{entry.status.replace("_", " ")}</b> · {new Date(entry.changedAt).toLocaleString("en-IN")}{entry.note ? <p className="mt-1">{entry.note}</p> : null}</li>)}</ul></details>}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Status</span><select value={draft.status} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, status: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800">{statuses.map(value => <option key={value} value={value}>{value.replace("_", " ")}</option>)}</select></label>
            <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Decision</span><select value={draft.decision} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, decision: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800"><option value="pending">Pending assessment</option><option value="approved">Approved</option><option value="partially_approved">Partially approved</option><option value="declined">Declined</option></select></label>
            <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Action taken</span><select value={draft.resolutionAction} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, resolutionAction: e.target.value } }))} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800"><option value="not_started">Not started</option><option value="provided">Data provided</option><option value="corrected">Data corrected</option><option value="erased">Erased</option><option value="anonymized">Anonymised</option><option value="retained_partially">Partially retained</option><option value="not_applicable">Not applicable</option></select></label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700"><input type="checkbox" checked={draft.identityVerified} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, identityVerified: e.target.checked } }))} />Requester identity verified</label>
          </div>
          <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Retention reason (required if any data is retained for an erasure request)</span><textarea rows={2} maxLength={2000} value={draft.retentionReason} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, retentionReason: e.target.value } }))} placeholder="Describe the legal/contractual retention reason and data category…" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800" /></label>
          <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Internal notes (admin only)</span><textarea rows={2} maxLength={4000} value={draft.internalNotes} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, internalNotes: e.target.value } }))} placeholder="Internal operational notes; not shown to the user…" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800" /></label>
          <div className="grid sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end"><label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Response to user (visible in Privacy Centre)</span><textarea rows={2} maxLength={4000} value={draft.response} onChange={e => setDrafts(current => ({ ...current, [item._id]: { ...draft, response: e.target.value } }))} placeholder="Write a clear response or note for the user…" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800" /></label><button onClick={() => updateRequest(item._id)} disabled={saving === item._id} className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">{saving === item._id ? "Saving…" : "Save update"}</button></div>
        </article>;
      })}</div>}
      <p className="text-xs text-slate-500 leading-relaxed">Operational safeguards: identity verification is required before closure. Completing an erasure request requires recording the actual deletion/anonymisation action, or documenting the reason for partial retention. This dashboard records actions; it does not automatically delete records from billing, backups, processors or other systems. Target response date is an internal 90-day tracking control, not a legal opinion on every request.</p>
    </div>
  );
};

export default PrivacyRequestsAdmin;
