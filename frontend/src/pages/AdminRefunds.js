import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../axios";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

const dateTime = (value) => value
  ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  : "—";

const statusStyles = {
  not_reviewed: "bg-amber-50 text-amber-700 border-amber-200",
  not_eligible: "bg-slate-100 text-slate-600 border-slate-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  processed: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

const statusLabels = {
  not_reviewed: "Awaiting review",
  not_eligible: "Not eligible",
  approved: "Approved · payout pending",
  rejected: "Rejected",
  processed: "Processed"
};

export default function AdminRefunds() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/auth/admin/refunds");
      setRecords(response.data.refunds || []);
      setStats(response.data.stats || {});
    } catch (err) {
      setError(err.response?.data?.message || "Could not load refund records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  const updateDraft = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...(current[id] || {}), [field]: value }
    }));
  };

  const submitAction = async (record, action) => {
    const draft = drafts[record._id] || {};
    if (action === "approve" && (!draft.amount || Number(draft.amount) <= 0)) {
      setError("Enter a valid refund amount greater than ₹0.");
      return;
    }
    if (["approve", "reject"].includes(action) && String(draft.reason || "").trim().length < 5) {
      setError("Please add a reason (at least 5 characters).");
      return;
    }
    if (action === "processed" && !String(draft.reference || "").trim()) {
      setError("Enter the bank/UPI refund reference first.");
      return;
    }
    const labels = {
      approve: "approve this exception refund",
      reject: "reject this refund",
      not_eligible: "mark this record as not eligible",
      processed: "mark the payout as processed"
    };
    if (!window.confirm("Are you sure you want to " + labels[action] + "?")) return;

    setSavingId(record._id);
    setError("");
    setSuccess("");
    try {
      const response = await axios.patch("/api/auth/admin/refunds/" + record._id, {
        action,
        amount: draft.amount,
        reason: draft.reason,
        reference: draft.reference
      });
      setSuccess(response.data.message || "Refund record updated.");
      await loadRefunds();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update refund record.");
    } finally {
      setSavingId("");
    }
  };

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((item) => {
      const statusMatch = filter === "all" || (item.refundStatus || "not_reviewed") === filter;
      const haystack = [
        item.user?.name, item.user?.email, item.uniqueId, item.transactionId,
        item.cashfreeOrderId, item.planName, item.plan
      ].join(" ").toLowerCase();
      return statusMatch && (!term || haystack.includes(term));
    });
  }, [records, filter, search]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-20 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Finance & billing</p>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Refund Management</h2>
          <p className="text-sm text-slate-500 mt-1">Review refunds linked to approved subscription cancellations and track payouts.</p>
        </div>
        <button type="button" onClick={loadRefunds} disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
          <span aria-hidden="true">↻</span> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Cancellation records" value={stats.total ?? records.length} />
        <StatCard label="Awaiting review" value={stats.awaitingReview ?? 0} />
        <StatCard label="Approved refund value" value={money(stats.approvedAmount)} />
        <StatCard label="Payouts pending" value={stats.pendingPayout ?? 0} />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Policy reminder:</strong> ASKC TECHNOLOGIES’ published subscription policy does not provide prorated refunds for unused days. Therefore, no refund is automatically promised. Review exceptional cases individually; the amount must never exceed verified payments received.
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, email, subscription ID or transaction…"
            className="w-full min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-sky-500">
            <option value="all">All refund statuses</option>
            <option value="not_reviewed">Awaiting review</option>
            <option value="not_eligible">Not eligible</option>
            <option value="approved">Approved · payout pending</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">Loading refund records…</div>
      ) : visibleRecords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center">
          <div className="text-3xl mb-2" aria-hidden="true">₹</div>
          <h3 className="font-semibold text-slate-800">No refund records found</h3>
          <p className="text-sm text-slate-500 mt-1">Cancellation records will appear here for refund review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleRecords.map((item) => {
            const status = item.refundStatus || "not_reviewed";
            const draft = drafts[item._id] || {};
            const isApprovedCancellation = item.cancellationStatus === "approved" && item.canceled;
            const locked = savingId === item._id;
            return (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 break-words">{item.user?.name || "Unknown user"}</h3>
                    <p className="text-sm text-slate-500 break-all">{item.user?.email || "No email"}</p>
                    <p className="text-xs text-slate-500 mt-2">Subscription: <span className="font-mono text-slate-700">{item.uniqueId}</span></p>
                  </div>
                  <span className={"self-start inline-flex rounded-full border px-3 py-1 text-xs font-semibold " + (statusStyles[status] || statusStyles.not_reviewed)}>
                    {statusLabels[status] || statusLabels.not_reviewed}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                  <Info label="Plan" value={item.planName || item.plan || "—"} />
                  <Info label="Verified paid" value={money(item.paidAmount)} />
                  <Info label="Refund amount" value={money(item.refundAmount)} emphasis />
                  <Info label="Cancellation requested" value={dateTime(item.cancellationRequestDate)} />
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs sm:text-sm text-slate-600 space-y-1">
                  <p><strong>Cancellation:</strong> {item.cancellationStatus || "—"} · <strong>Payment:</strong> {item.paymentStatus || "—"} ({item.paymentMethod || "—"})</p>
                  {item.transactionId && <p><strong>Transaction:</strong> <span className="font-mono break-all">{item.transactionId}</span></p>}
                  {item.cancellationReason && <p><strong>User reason:</strong> {item.cancellationReason}</p>}
                  {item.refundReason && <p><strong>Admin decision note:</strong> {item.refundReason}</p>}
                  {item.refundReference && <p><strong>Refund reference:</strong> <span className="font-mono break-all">{item.refundReference}</span></p>}
                  {item.refundProcessedAt && <p><strong>Processed:</strong> {dateTime(item.refundProcessedAt)}</p>}
                </div>

                {!isApprovedCancellation ? (
                  <p className="mt-4 text-sm text-slate-500">Approve the cancellation in the Cancellations tab before making a refund decision.</p>
                ) : status === "processed" ? (
                  <p className="mt-4 text-sm font-medium text-emerald-700">Refund payout has been recorded as processed.</p>
                ) : (
                  <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                    {status === "approved" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
                        <label className="block min-w-0">
                          <span className="block text-xs font-semibold text-slate-600 mb-1">Bank / UPI refund reference</span>
                          <input value={draft.reference || ""} onChange={(e) => updateDraft(item._id, "reference", e.target.value)}
                            placeholder="Enter UTR / transaction reference"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                        </label>
                        <button type="button" disabled={locked} onClick={() => submitAction(item, "processed")}
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                          {locked ? "Saving…" : "Mark payout processed"}
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-slate-500">Only an admin-approved exception can receive a refund. Enter an amount up to {money(item.paidAmount)}.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <label className="block">
                            <span className="block text-xs font-semibold text-slate-600 mb-1">Approved refund amount (₹)</span>
                            <input type="number" min="0.01" max={item.paidAmount || 0} step="0.01"
                              value={draft.amount || ""} onChange={(e) => updateDraft(item._id, "amount", e.target.value)}
                              placeholder="0.00" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                          </label>
                          <label className="block">
                            <span className="block text-xs font-semibold text-slate-600 mb-1">Decision reason / notes</span>
                            <input value={draft.reason || ""} onChange={(e) => updateDraft(item._id, "reason", e.target.value)}
                              placeholder="Explain the exceptional refund decision"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sky-500" />
                          </label>
                        </div>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                          <button type="button" disabled={locked || Number(item.paidAmount) <= 0} onClick={() => submitAction(item, "approve")}
                            className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50">
                            Approve exception refund
                          </button>
                          <button type="button" disabled={locked} onClick={() => submitAction(item, "not_eligible")}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                            Mark not refundable
                          </button>
                          <button type="button" disabled={locked} onClick={() => submitAction(item, "reject")}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50">
                            Reject refund
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-w-0">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 break-words">{value}</p>
  </div>;
}

function Info({ label, value, emphasis }) {
  return <div className="rounded-xl border border-slate-100 bg-white p-3 min-w-0">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className={"mt-1 text-sm font-semibold break-words " + (emphasis ? "text-sky-700" : "text-slate-800")}>{value}</p>
  </div>;
}
