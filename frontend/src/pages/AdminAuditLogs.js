import React, { useCallback, useEffect, useState } from "react";
import axios from "../axios";

const formatDate = value => value ? new Date(value).toLocaleString() : "—";
const actionStyle = action => ({
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-blue-50 text-blue-700",
  archive: "bg-amber-50 text-amber-700",
  delete: "bg-red-50 text-red-700"
}[action] || "bg-slate-100 text-slate-700");

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [entityType, setEntityType] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/cms/audit-logs", {
        params: { page, limit: 25, q: search.trim() || undefined, action: action === "all" ? undefined : action, entityType: entityType === "all" ? undefined : entityType }
      });
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination || { total: 0, pages: 1, limit: 25 });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load audit activity.");
    } finally {
      setLoading(false);
    }
  }, [page, search, action, entityType]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, action, entityType]);

  const exportCsv = () => {
    const columns = ["createdAt", "actor", "action", "entityType", "entityId", "summary"];
    const quote = value => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const rows = [columns.join(","), ...logs.map(log => columns.map(key => quote(key === "actor" ? (log.actor?.name || log.actor?.email || "System") : log[key])).join(","))];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "askc-audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-4 md:p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold tracking-[.18em] text-blue-600">ASKC TECHNOLOGIES / SECURITY</p>
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Audit log</h2>
          <p className="mt-1 text-sm text-slate-500">Track content changes and administrative activity.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
          <button type="button" onClick={exportCsv} disabled={!logs.length} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Export CSV</button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Matching events</p><p className="mt-1 text-2xl font-bold text-slate-900">{pagination.total}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Events on this page</p><p className="mt-1 text-2xl font-bold text-blue-600">{logs.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Current page</p><p className="mt-1 text-2xl font-bold text-slate-900">{page} <span className="text-sm font-medium text-slate-400">/ {pagination.pages || 1}</span></p></div>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_190px_190px]">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search summary, user or record ID…" className="min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        <select value={action} onChange={event => setAction(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="all">All actions</option><option value="create">Create</option><option value="update">Update</option><option value="archive">Archive</option><option value="delete">Delete</option></select>
        <select value={entityType} onChange={event => setEntityType(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="all">All content types</option><option value="page">Page</option><option value="service">Service</option><option value="product">Product</option><option value="portfolio">Portfolio</option><option value="industry">Industry</option><option value="article">Article</option><option value="career">Career</option><option value="testimonial">Testimonial</option><option value="site-setting">Site setting</option></select>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {loading ? <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Loading audit activity…</div> :
        logs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><p className="font-semibold text-slate-700">No activity found</p><p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p></div> :
        <div className="space-y-3">
          {logs.map(log => <article key={log._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={"rounded-full px-2.5 py-1 text-[11px] font-bold uppercase " + actionStyle(log.action)}>{log.action}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{log.entityType}</span>
                </div>
                <h3 className="break-words text-sm font-semibold text-slate-900">{log.summary}</h3>
                <p className="mt-1 text-xs text-slate-500">{log.actor?.name || log.actor?.email || "System"} · {formatDate(log.createdAt)}</p>
              </div>
              <span className="max-w-full break-all rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-[10px] text-slate-500">{log.entityId || "No record ID"}</span>
            </div>
          </article>)}
        </div>
      }

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs text-slate-500">Showing {logs.length} of {pagination.total} events</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={page <= 1 || loading} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Previous</button>
          <button type="button" onClick={() => setPage(current => Math.min(pagination.pages || 1, current + 1))} disabled={page >= (pagination.pages || 1) || loading} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
