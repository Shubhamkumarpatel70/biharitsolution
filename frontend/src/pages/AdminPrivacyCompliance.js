import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../axios";

const AdminPrivacyCompliance = () => {
  const [payload, setPayload] = useState({ current: null, reviews: [], checklist: [] });
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }), []);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await axios.get("/api/privacy-compliance", { headers });
      setPayload(response.data);
      const current = response.data.current;
      setMonth(current.month);
      setItems(response.data.checklist.map(check => current.items.find(item => item.key === check.key) || { key: check.key, completed: false, evidence: "", notes: "" }));
      setSummary(current.summary || "");
      setStatus(current.status || "in_progress");
    } catch (err) { setError(err.response?.data?.message || "Could not load compliance reviews."); }
    finally { setLoading(false); }
  }, [headers]);
  useEffect(() => { load(); }, [load]);

  const updateItem = (key, field, value) => setItems(current => current.map(item => item.key === key ? { ...item, [field]: value } : item));
  const completed = items.filter(item => item.completed).length;
  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await axios.put(`/api/privacy-compliance/${month}`, { items, summary, status }, { headers });
      setNotice(response.data.message);
      await load();
    } catch (err) { setError(err.response?.data?.message || "Could not save this review."); }
    finally { setSaving(false); }
  };
  const exportReport = async () => {
    try {
      const response = await axios.get(`/api/privacy-compliance/${month}/export`, { headers, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = `askc-privacy-review-${month}.csv`;
      document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { setError(err.response?.data?.message || "Could not export the report."); }
  };
  const chooseMonth = async value => {
    setMonth(value);
    const found = payload.reviews.find(review => review.month === value);
    setItems(payload.checklist.map(check => found?.items?.find(item => item.key === check.key) || { key: check.key, completed: false, evidence: "", notes: "" }));
    setSummary(found?.summary || ""); setStatus(found?.status || "in_progress");
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading monthly privacy review…</div>;
  return <div className="max-w-7xl mx-auto space-y-5">
    <header className="rounded-2xl bg-slate-900 text-white p-5 sm:p-7">
      <p className="text-xs uppercase tracking-widest text-sky-300 font-semibold">ASKC TECHNOLOGIES · DPDP GOVERNANCE</p>
      <h2 className="text-2xl font-bold mt-2">Monthly Privacy Compliance Review</h2>
      <p className="text-sm text-slate-300 mt-2 max-w-3xl">A documented operational review to help assess privacy controls. Completing this checklist does not itself certify legal compliance.</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Checks completed</p><p className="text-2xl font-bold mt-1">{completed}/{payload.checklist.length}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Completion</p><p className="text-2xl font-bold mt-1">{payload.checklist.length ? Math.round(completed / payload.checklist.length * 100) : 0}%</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Review status</p><p className="text-base font-bold mt-2 capitalize">{status.replaceAll("_", " ")}</p></div>
      <div className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">Saved history</p><p className="text-2xl font-bold mt-1">{payload.reviews.length}</p></div>
    </section>
    <section className="rounded-xl border bg-white p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
      <label className="text-sm font-semibold text-slate-700">Review month<input type="month" value={month} onChange={e => chooseMonth(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label>
      <div className="flex flex-wrap gap-2"><button onClick={exportReport} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Export CSV</button><button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Print / Save PDF</button><button onClick={save} disabled={saving} className="rounded-lg bg-slate-900 text-white px-5 py-2 text-sm font-semibold disabled:opacity-50">{saving ? "Saving…" : "Save review"}</button></div>
    </section>
    <section className="space-y-3">
      {payload.checklist.map((check, index) => {
        const item = items.find(entry => entry.key === check.key) || {};
        return <article key={check.key} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3"><input type="checkbox" checked={Boolean(item.completed)} onChange={e => updateItem(check.key, "completed", e.target.checked)} className="mt-1 h-4 w-4"/><div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-900">{index + 1}. {check.title}</h3><p className="text-sm text-slate-500 mt-1">{check.description}</p></div><span className={`text-xs font-semibold ${item.completed ? "text-emerald-700" : "text-slate-400"}`}>{item.completed ? "Done" : "Pending"}</span></div>
          <div className="grid md:grid-cols-2 gap-3"><label className="text-xs font-semibold text-slate-600">Evidence / reference<input value={item.evidence || ""} onChange={e => updateItem(check.key, "evidence", e.target.value)} maxLength={2000} placeholder="Ticket, policy version, audit reference…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"/></label><label className="text-xs font-semibold text-slate-600">Notes / corrective action<input value={item.notes || ""} onChange={e => updateItem(check.key, "notes", e.target.value)} maxLength={2000} placeholder="Finding, owner or next action…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"/></label></div>
        </article>;
      })}
    </section>
    <section className="rounded-xl border bg-white p-4 sm:p-5 space-y-3"><label className="block text-sm font-semibold text-slate-700">Monthly review summary<textarea value={summary} onChange={e => setSummary(e.target.value)} maxLength={4000} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm font-normal" placeholder="Key findings, risks, remediation owner and target dates…"/></label><label className="block text-sm font-semibold text-slate-700">Review status<select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"><option value="in_progress">In progress</option><option value="ready_for_review">Ready for review</option><option value="completed">Completed</option></select></label><p className="text-xs text-slate-500">Completed reviews are timestamped and retain an audit history. Do not attach passwords, OTPs, payment credentials or unnecessary personal data as evidence.</p></section>
    <section className="rounded-xl border bg-white p-4"><h3 className="font-semibold text-slate-900 mb-3">Review history</h3>{payload.reviews.length ? <div className="space-y-2">{payload.reviews.map(review => <button key={review.month} onClick={() => chooseMonth(review.month)} className="w-full text-left rounded-lg border border-slate-200 p-3 hover:bg-slate-50 flex justify-between gap-3"><span className="font-medium">{review.month}</span><span className="text-xs capitalize text-slate-500">{review.status.replaceAll("_", " ")} · {review.items.filter(item => item.completed).length}/{payload.checklist.length} checks</span></button>)}</div> : <p className="text-sm text-slate-500">No saved reviews yet.</p>}</section>
  </div>;
};
export default AdminPrivacyCompliance;
