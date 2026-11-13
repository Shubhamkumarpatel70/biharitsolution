import React, { useCallback, useEffect, useState } from "react";
import axios from "../axios";

const requestTypes = [
  { value: "access", label: "Access my data", help: "Ask for information about personal data associated with your account." },
  { value: "correction", label: "Correct my data", help: "Tell us which personal information is inaccurate or incomplete." },
  { value: "erasure", label: "Delete my data", help: "Request erasure of eligible personal data. Some records may need to be retained for legal, security or accounting purposes." },
  { value: "grievance", label: "Privacy grievance", help: "Raise a concern about how your personal data is handled." }
];

const statusLabels = {
  submitted: "Submitted",
  in_review: "In review",
  awaiting_user: "Awaiting your response",
  completed: "Completed",
  rejected: "Closed / rejected"
};

const PrivacyCenter = () => {
  const [data, setData] = useState({ user: null, requests: [], consentHistory: [] });
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [type, setType] = useState("access");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const headers = useCallback(() => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }), []);

  const loadPrivacyData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/auth/privacy/me", { headers: headers() });
      setData(response.data);
      setMarketingEmails(Boolean(response.data.user?.marketingConsent || response.data.user?.subscribeOffers));
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your privacy information.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { loadPrivacyData(); }, [loadPrivacyData]);

  const saveConsent = async () => {
    setSaving(true); setMessage(""); setError("");
    try {
      const response = await axios.patch("/api/auth/privacy/consent", { marketingEmails }, { headers: headers() });
      setMessage(response.data.message);
      await loadPrivacyData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save your preference.");
    } finally { setSaving(false); }
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setSubmitting(true); setMessage(""); setError("");
    try {
      await axios.post("/api/auth/privacy/requests", { type, details }, { headers: headers() });
      setDetails("");
      setMessage("Your privacy request has been submitted. You can track its status below.");
      await loadPrivacyData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit your request.");
    } finally { setSubmitting(false); }
  };

  const exportData = async () => {
    setExporting(true); setMessage(""); setError("");
    try {
      const response = await axios.get("/api/auth/privacy/export", {
        headers: headers(),
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "askc-personal-data.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      setMessage("Your personal data export has been prepared.");
    } catch (err) {
      setError("Could not prepare your data export. Please try again.");
    } finally { setExporting(false); }
  };

  if (loading) return <div className="max-w-5xl mx-auto p-8 text-center text-slate-500">Loading Privacy Centre…</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <header className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-sky-300 font-semibold">ASKC TECHNOLOGIES</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Privacy Centre</h1>
        <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">Review your privacy choices, request help with your personal data and keep track of privacy-related requests.</p>
      </header>

      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Your account information</h2>
          <p className="text-sm text-slate-500 mt-1">Basic account details currently associated with your profile.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">Name</p><p className="font-semibold text-slate-900 mt-1">{data.user?.name || "—"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">Email</p><p className="font-semibold text-slate-900 mt-1 break-all">{data.user?.email || "—"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">Account created</p><p className="font-semibold text-slate-900 mt-1">{data.user?.createdAt ? new Date(data.user.createdAt).toLocaleString("en-IN") : "—"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-slate-500">Last profile update</p><p className="font-semibold text-slate-900 mt-1">{data.user?.updatedAt ? new Date(data.user.updatedAt).toLocaleString("en-IN") : "—"}</p></div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4">
          <div><h3 className="font-semibold text-slate-900">Download my personal data</h3><p className="text-xs text-slate-500 mt-1">Export the account data currently available in ASKC systems as a JSON file.</p></div>
          <button type="button" onClick={exportData} disabled={exporting} className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50">{exporting ? "Preparing…" : "Download my data"}</button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div><h2 className="text-lg font-bold text-slate-900">Marketing communication preference</h2><p className="text-sm text-slate-500 mt-1">This choice is optional and does not affect your account or purchased services.</p></div>
        <label className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 cursor-pointer">
          <input type="checkbox" checked={marketingEmails} onChange={e => setMarketingEmails(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
          <span><span className="block text-sm font-semibold text-slate-900">I want to receive promotional emails from ASKC TECHNOLOGIES.</span><span className="block text-xs text-slate-500 mt-1">You can withdraw this permission here at any time. Essential account and service messages may still be sent.</span></span>
        </label>
        <button type="button" onClick={saveConsent} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{saving ? "Saving…" : "Save preference"}</button>
        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-800">Consent history</h3>
          {data.consentHistory?.length ? <ul className="mt-2 space-y-2">{data.consentHistory.map(item => <li key={item._id} className="flex flex-wrap justify-between gap-2 text-xs text-slate-600"><span>{item.purpose.replace("_", " ")} · <b className={item.action === "granted" ? "text-emerald-700" : "text-amber-700"}>{item.action}</b></span><span>{new Date(item.occurredAt).toLocaleString("en-IN")}</span></li>)}</ul> : <p className="text-xs text-slate-500 mt-2">No consent changes recorded from this Privacy Centre yet.</p>}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
        <div><h2 className="text-lg font-bold text-slate-900">Submit a privacy request</h2><p className="text-sm text-slate-500 mt-1">Choose the request that best describes what you need. Please do not include passwords, OTPs or payment card details.</p></div>
        <form onSubmit={submitRequest} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {requestTypes.map(item => <label key={item.value} className={`border rounded-xl p-4 cursor-pointer ${type === item.value ? "border-sky-500 bg-sky-50" : "border-slate-200 hover:bg-slate-50"}`}><span className="flex items-center gap-2"><input type="radio" name="privacyType" value={item.value} checked={type === item.value} onChange={() => setType(item.value)} /><b className="text-sm text-slate-900">{item.label}</b></span><span className="block text-xs text-slate-500 mt-2">{item.help}</span></label>)}
          </div>
          <textarea value={details} onChange={e => setDetails(e.target.value)} minLength={10} maxLength={4000} required rows={4} placeholder="Describe your request (minimum 10 characters)…" className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500" />
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-400">{details.length}/4000 characters</span><button type="submit" disabled={submitting || details.trim().length < 10} className="rounded-xl bg-sky-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-sky-800 disabled:opacity-50">{submitting ? "Submitting…" : "Submit privacy request"}</button></div>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">My privacy requests</h2><p className="text-sm text-slate-500 mt-1">Track submitted requests and responses from our team.</p></div><button type="button" onClick={loadPrivacyData} className="text-sm font-semibold text-sky-700">Refresh</button></div>
        {data.requests?.length ? <div className="mt-4 space-y-3">{data.requests.map(item => <article key={item._id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-slate-900 capitalize">{item.type} request</p><p className="text-xs text-slate-500 mt-1">Submitted {new Date(item.createdAt).toLocaleString("en-IN")}{item.dueAt ? ` · Target response date ${new Date(item.dueAt).toLocaleDateString("en-IN")}` : ""}</p></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{statusLabels[item.status] || item.status}</span></div><p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{item.details}</p>{item.response && <div className="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-900"><b>Team response:</b><p className="mt-1 whitespace-pre-wrap">{item.response}</p></div>}</article>)}</div> : <p className="mt-5 text-sm text-slate-500 text-center py-6">You have not submitted any privacy requests yet.</p>}
      </section>
      <p className="text-xs text-slate-500 leading-relaxed">Requests are reviewed by ASKC TECHNOLOGIES. Erasure and other requests may be subject to identity verification, applicable legal obligations and lawful retention requirements. This portal supports privacy operations but does not itself guarantee legal compliance.</p>
    </div>
  );
};

export default PrivacyCenter;
