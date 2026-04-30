import React, { useEffect, useMemo, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const AdminFunds = () => {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalType, setModalType] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const token = localStorage.getItem('token');

  const fetchFunds = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/auth/admin/funds', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data.transactions || []);
      setBalance(Number(res.data.balance || 0));
    } catch (err) {
      setError('Failed to load funds data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [token]);

  const closeModal = () => {
    setModalType('');
    setAmount('');
    setReason('');
    setSubmitError('');
  };

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, item) => {
        if (item.type === 'add') acc.added += Number(item.amount || 0);
        if (item.type === 'withdraw') acc.withdrawn += Number(item.amount || 0);
        return acc;
      },
      { added: 0, withdrawn: 0 }
    );
  }, [transactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid amount in INR.');
      return;
    }
    if (!reason.trim()) {
      setSubmitError('Please enter a reason.');
      return;
    }
    if (modalType === 'withdraw' && parsedAmount > balance) {
      setSubmitError('Withdrawal amount cannot exceed current balance.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        '/api/auth/admin/funds',
        { type: modalType, amount: parsedAmount, reason: reason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.transaction) {
        setTransactions((prev) => [res.data.transaction, ...prev]);
      }
      setBalance(Number(res.data?.balance || 0));
      closeModal();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not submit transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Funds Management</h2>
            <p className="text-sm text-slate-500 mt-1">Track balance, add funds, and withdraw with reason-based statements.</p>
          </div>
          <div className="rounded-xl bg-slate-900 text-white px-4 py-3 min-w-[14rem]">
            <p className="text-xs uppercase tracking-wide text-slate-300">Current balance</p>
            <p className="text-2xl font-bold tabular-nums mt-1">{currency(balance)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">Total added</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1 tabular-nums">{currency(totals.added)}</p>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <p className="text-sm text-red-700">Total withdrawn</p>
          <p className="text-2xl font-bold text-red-900 mt-1 tabular-nums">{currency(totals.withdrawn)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setModalType('add')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors"
          >
            Add Funds
          </button>
          <button
            type="button"
            onClick={() => setModalType('withdraw')}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Statement</h3>
          <button
            type="button"
            onClick={fetchFunds}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Icon name="refresh" className="w-4 h-4" />
            Refresh
          </button>
        </div>
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading statement...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No fund statement entries yet.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.type === 'add' ? 'Funds Added' : 'Funds Withdrawn'}
                      </p>
                      <p className="text-sm text-slate-600 mt-0.5">{item.reason}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        By {item.createdBy?.name || 'Admin'} • {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className={`text-base font-bold tabular-nums ${item.type === 'add' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {item.type === 'add' ? '+' : '-'} {currency(item.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900">
                {modalType === 'add' ? 'Add Fund' : 'Withdraw Fund'}
              </h4>
              <button type="button" onClick={closeModal} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (Indian Rupees)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40"
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-500/40 resize-none"
                  placeholder={modalType === 'add' ? 'Reason for adding funds' : 'Reason for withdrawal'}
                  required
                />
              </div>
              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${
                    modalType === 'add'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFunds;
