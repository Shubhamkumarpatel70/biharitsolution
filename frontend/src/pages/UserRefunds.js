import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../axios";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2
}).format(Number(value || 0));

const dateTime = (value) => value
  ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  : "—";

const refundStatus = {
  not_reviewed: { label: "Awaiting refund review", style: "bg-amber-50 text-amber-800 border-amber-200" },
  approved: { label: "Approved · payout pending", style: "bg-blue-50 text-blue-800 border-blue-200" },
  processed: { label: "Refund processed", style: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  rejected: { label: "Refund request declined", style: "bg-rose-50 text-rose-800 border-rose-200" },
  not_eligible: { label: "Not eligible for refund", style: "bg-slate-100 text-slate-700 border-slate-200" }
};

export default function UserRefunds() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRefunds = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/auth/user/refunds", {
        headers: { Authorization: `Bearer ${token}` },
        params: { _t: Date.now() }
      });
      setRecords(response.data.refunds || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your refund details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadRefunds(); }, [loadRefunds]);

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter((item) => item.cancellationStatus === "pending" || item.refundStatus === "not_reviewed").length,
    approved: records.filter((item) => ["approved", "processed"].includes(item.refundStatus))
      .reduce((sum, item) => sum + Number(item.refundAmount || 0), 0),
    processed: records.filter((item) => item.refundStatus === "processed").length
  }), [records]);

  if (loading) return (
    <div className="min-h-[360px] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading your refund details…</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20 lg:pb-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Account · Finance</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">My Refunds</h1>
          <p className="mt-1 text-sm text-slate-500">Track your cancellation requests, refund decisions and payout status.</p>
        </div>
        <button type="button" onClick={() => loadRefunds(true)} disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
          <span aria-hidden="true">↻</span>{refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Summary label="Records" value={stats.total} />
        <Summary label="Awaiting review" value={stats.pending} />
        <Summary label="Approved refund value" value={money(stats.approved)} />
        <Summary label="Completed payouts" value={stats.processed} />
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
        Refund eligibility and amount are reviewed by ASKC TECHNOLOGIES under the published cancellation policy. A cancellation request does not itself mean that a refund has been approved.
      </div>

      {!error && records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-600">₹</div>
          <h2 className="font-semibold text-slate-900">No refund activity yet</h2>
          <p className="mt-1 text-sm text-slate-500">When you request a subscription cancellation, its progress will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((item) => {
            const cancellationPending = item.cancellationStatus === "pending";
            const state = refundStatus[item.refundStatus] || refundStatus.not_reviewed;
            const label = cancellationPending ? "Cancellation awaiting approval" : state.label;
            const style = cancellationPending ? "bg-amber-50 text-amber-800 border-amber-200" : state.style;
            return (
              <article key={item._id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 break-words">{item.planName || item.plan || "Subscription"}</h2>
                    <p className="mt-1 text-xs text-slate-500">Subscription ID: <span className="font-mono break-all text-slate-700">{item.uniqueId || item._id}</span></p>
                  </div>
                  <span className={`inline-flex self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${style}`}>{label}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <Detail label="Verified amount paid" value={money(item.paidAmount)} />
                  <Detail label="Refund amount" value={money(item.refundAmount)} highlight />
                  <Detail label="Cancellation requested" value={dateTime(item.cancellationRequestDate)} />
                  <Detail label="Payout date" value={dateTime(item.refundProcessedAt)} />
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600 space-y-1.5 break-words">
                  <p><strong className="text-slate-800">Cancellation status:</strong> {item.cancellationStatus || "Not requested"}</p>
                  {item.cancellationReason && <p><strong className="text-slate-800">Your reason:</strong> {item.cancellationReason}</p>}
                  {item.cancellationRejectionReason && <p><strong className="text-slate-800">Cancellation decision:</strong> {item.cancellationRejectionReason}</p>}
                  {item.refundReason && <p><strong className="text-slate-800">Refund decision:</strong> {item.refundReason}</p>}
                  {item.refundReference && <p><strong className="text-slate-800">Refund reference:</strong> <span className="font-mono break-all">{item.refundReference}</span></p>}
                  {item.refundStatus === "approved" && <p className="text-blue-700 font-medium">Your refund is approved. The payout is still pending confirmation.</p>}
                  {item.refundStatus === "processed" && <p className="text-emerald-700 font-medium">Your refund has been marked as processed by ASKC TECHNOLOGIES.</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value }) {
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
    <p className="text-xs text-slate-500">{label}</p>
    <p className="mt-1 break-words text-lg sm:text-xl font-bold text-slate-900">{value}</p>
  </div>;
}

function Detail({ label, value, highlight }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3">
    <p className="text-[11px] font-medium text-slate-500">{label}</p>
    <p className={`mt-1 text-sm sm:text-base font-bold break-words ${highlight ? "text-sky-700" : "text-slate-900"}`}>{value}</p>
  </div>;
}
