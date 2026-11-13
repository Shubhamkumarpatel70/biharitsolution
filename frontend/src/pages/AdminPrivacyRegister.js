import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../axios";

const empty = { title: "", organisation: "", purpose: "", dataCategories: "", systems: "", contact: "", agreementStatus: "not_reviewed", retention: "", status: "open", severity: "low", detectedAt: "", affectedCount: 0, containment: "", regulatorNotifiedAt: "", usersNotifiedAt: "", resolution: "", notes: "" };
const label = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const dateValue = value => value ? new Date(value).toISOString().slice(0, 10) : "";

export default function AdminPrivacyRegister() {
  const [type, setType] = useState("processor");
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem("token")}` }), []);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await axios.get("/api/privacy-register", { headers }); setEntries(response.data.entries || []); }
    catch (e) { setError(e.response?.data?.message || "Could not load privacy registers."); }
    finally { setLoading(false); }
  }, [headers]);
  useEffect(() => { load(); }, [load]);
  const visible = entries.filter(entry => entry.type === type);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const startEdit = entry => {
    setEditing(entry._id);
    const next = { ...empty };
    Object.keys(empty).forEach(key => { next[key] = ["detectedAt", "regulatorNotifiedAt", "usersNotifiedAt"].includes(key) ? dateValue(entry[key]) : (entry[key] ?? empty[key]); });
    setForm(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => { setEditing(null); setForm(empty); };
  const save = async event => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const payload = { ...form, type, affectedCount: Number(form.affectedCount || 0) };
      const response = editing ? await axios.put(`/api/privacy-register/${editing}`, payload, { headers }) : await axios.post("/api/privacy-register", payload, { headers });
      setNotice(response.data.message); reset(); await load();
    } catch (e) { setError(e.response?.data?.message || "Could not save entry."); }
    finally { setSaving(false); }
  };
  const Field = ({ name, title, area = false }) => <label className="block text-xs font-semibold text-slate-600">{title || label(name)}{area ? <textarea value={form[name]} onChange={e => update(name, e.target.value)} maxLength={3000} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal"/> : <input value={form[name]} onChange={e => update(name, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal"/>}</label>;
  const Select = ({ name, options }) => <label className="block text-xs font-semibold text-slate-600">{label(name)}<select value={form[name]} onChange={e => update(name, e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal">{options.map(option => <option key={option} value={option}>{label(option)}</option>)}</select></label>;
  if (loading) return <div className="p-8 text-center text-slate-500">Loading privacy registers…</div>;
  return <div className="mx-auto max-w-7xl space-y-5">
    <header className="rounded-2xl bg-slate-900 p-5 sm:p-7 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-sky-300">ASKC TECHNOLOGIES · DPDP GOVERNANCE</p><h2 className="mt-2 text-2xl font-bold">Privacy Registers</h2><p className="mt-2 max-w-3xl text-sm text-slate-300">Maintain processor oversight and personal data incident records. Record facts accurately; this tool does not send statutory notifications automatically or certify compliance.</p></header>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <div className="flex flex-wrap gap-2"><button onClick={() => { setType("processor"); reset(); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === "processor" ? "bg-slate-900 text-white" : "border bg-white"}`}>Processors / Vendors</button><button onClick={() => { setType("incident"); reset(); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${type === "incident" ? "bg-slate-900 text-white" : "border bg-white"}`}>Data Incidents</button></div>
    <form onSubmit={save} className="space-y-4 rounded-xl border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{editing ? "Update" : "Add"} {type === "processor" ? "processor / vendor" : "data incident"}</h3>{editing && <button type="button" onClick={reset} className="text-sm underline">Cancel edit</button>}</div>
      <div className="grid gap-3 sm:grid-cols-2"><Field name="title" title={type === "processor" ? "Provider / vendor name *" : "Incident title *"}/><Field name="organisation" title={type === "processor" ? "Legal entity / organisation" : "Affected system / organisation"}/>{type === "processor" ? <><Field name="purpose" title="Processing purpose" area/><Field name="dataCategories" title="Personal data categories" area/><Field name="systems" title="Systems / service used"/><Field name="contact" title="Vendor contact / DPO contact"/><Select name="agreementStatus" options={["not_reviewed","under_review","signed","not_required"]}/><Field name="retention" title="Retention / deletion terms" area/></> : <><Select name="severity" options={["low","medium","high","critical"]}/><Select name="status" options={["open","investigating","contained","resolved","closed"]}/><Field name="detectedAt" title="Detected date"/><Field name="affectedCount" title="Estimated affected people"/><Field name="dataCategories" title="Data categories potentially affected" area/><Field name="systems" title="Systems / records involved"/><Field name="containment" title="Containment actions" area/><Field name="regulatorNotifiedAt" title="Regulator notification date (if applicable)"/><Field name="usersNotifiedAt" title="Affected individuals notification date (if applicable)"/><Field name="resolution" title="Investigation / resolution" area/></>}</div>
      <Field name="notes" title="Internal notes / next actions" area/>
      <button disabled={saving || !form.title.trim()} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : editing ? "Save changes" : "Add to register"}</button>
    </form>
    <section className="space-y-3"><div className="flex items-center justify-between"><h3 className="font-semibold text-slate-900">{type === "processor" ? "Processor & vendor register" : "Personal data incident register"}</h3><span className="text-xs text-slate-500">{visible.length} records</span></div>
      {visible.length ? visible.map(entry => <article key={entry._id} className="rounded-xl border bg-white p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h4 className="font-semibold text-slate-900">{entry.title}</h4><p className="mt-1 text-xs text-slate-500">{entry.organisation || "—"} · Created {new Date(entry.createdAt).toLocaleString()} · Updated {new Date(entry.updatedAt).toLocaleString()}</p></div><button onClick={() => startEdit(entry)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">Edit</button></div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{(type === "processor" ? [["Purpose",entry.purpose],["Data categories",entry.dataCategories],["Systems",entry.systems],["Agreement",label(entry.agreementStatus)],["Retention",entry.retention],["Contact",entry.contact]] : [["Severity",label(entry.severity)],["Status",label(entry.status)],["Detected",entry.detectedAt ? new Date(entry.detectedAt).toLocaleString() : "—"],["Affected people",entry.affectedCount],["Data categories",entry.dataCategories],["Containment",entry.containment],["Regulator notified",entry.regulatorNotifiedAt ? new Date(entry.regulatorNotifiedAt).toLocaleDateString() : "—"],["Individuals notified",entry.usersNotifiedAt ? new Date(entry.usersNotifiedAt).toLocaleDateString() : "—"],["Resolution",entry.resolution]]).map(([key,value]) => <div key={key}><span className="font-semibold text-slate-600">{key}: </span><span className="break-words text-slate-700">{value || "—"}</span></div>)}</div>
      {entry.notes && <p className="mt-3 border-t pt-3 text-sm text-slate-600">{entry.notes}</p>}<p className="mt-3 text-[11px] text-slate-400">Audit: {entry.auditHistory?.length || 0} recorded action(s)</p></article>) : <div className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">No records yet. Add your first {type === "processor" ? "processor / vendor" : "incident"} above.</div>}
    </section>
    <p className="text-xs text-slate-500">Suggested processor entries may include hosting, database, payment, email and analytics providers actually used by ASKC. Verify contracts and processing locations before recording them. Never store passwords, OTPs, access tokens or full payment credentials here.</p>
  </div>;
}
