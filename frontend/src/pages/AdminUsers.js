import React, { useEffect, useState, useMemo } from 'react';
import './AdminWorkspace.css';
import axios from '../axios';
import AdminFilterBar from '../components/AdminFilterBar';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingRole, setChangingRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [billingBusy, setBillingBusy] = useState(null);
  const [planModalUser, setPlanModalUser] = useState(null);
  const [existingPlans, setExistingPlans] = useState([]);
  const [planChoice, setPlanChoice] = useState('');
  const [planForm, setPlanForm] = useState({ planName: 'Custom Plan', totalAmount: '5000', durationDays: '30', note: '' });
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [clientForm, setClientForm] = useState({ email: '', password: '' });
  const [creatingClient, setCreatingClient] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = Array.isArray(users) ? [...users] : [];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    // Date filter
    if (filters.dateRange?.start || filters.dateRange?.end) {
      filtered = filtered.filter(user => {
        const userDate = new Date(user.createdAt);
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (userDate < startDate) return false;
        }
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (userDate > endDate) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [users, searchTerm, filters]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch (err) {
        setError('Could not fetch users.');
      }
      setLoading(false);
    };
    fetchUsers();
    axios.get('/api/auth/plans').then(r => setExistingPlans(Array.isArray(r.data?.plans) ? r.data.plans : [])).catch(() => setExistingPlans([]));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setChangingRole(userId);
      setError('');
      const token = localStorage.getItem('token');
      await axios.put(`/api/auth/admin/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
      
      const roleDisplayName = newRole === 'coadmin' ? 'Co-Admin' : newRole.charAt(0).toUpperCase() + newRole.slice(1);
      setSuccess(`User role updated to ${roleDisplayName} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setChangingRole(null);
    }
  };


  const openAssignPlan = (user) => {
    setPlanModalUser(user);
    setPlanChoice(user.latestSubscription?.sourcePlan || 'others');
    setPlanForm({
      planName: user.latestSubscription?.planName || 'Custom Plan',
      totalAmount: String(user.latestSubscription?.totalAmount ?? '5000'),
      durationDays: String(user.latestSubscription?.durationDays || '30'),
      note: ''
    });
    setError('');
  };

  const assignPlan = async (event) => {
    event.preventDefault();
    if (!planModalUser) return;
    const totalAmount = Number(planForm.totalAmount);
    const durationDays = Number(planForm.durationDays);
    if (!planChoice) { setError('Choose an Existing Plan or select Others for a custom plan.'); return; }
    if (!planForm.planName.trim() || !Number.isFinite(totalAmount) || totalAmount < 0 || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
      setError('Enter a plan name, valid amount and validity between 1 and 3650 days.');
      return;
    }
    setBillingBusy(planModalUser._id);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/admin/users/' + planModalUser._id + '/assign-plan', {
        planId: planChoice !== 'others' ? planChoice : null,
        planName: planForm.planName.trim(), totalAmount, durationDays, note: planForm.note.trim()
      }, { headers: { Authorization: 'Bearer ' + token } });
      const r = await axios.get('/api/auth/admin/users', { headers: { Authorization: 'Bearer ' + token } });
      setUsers(Array.isArray(r.data?.users) ? r.data.users : []);
      setSuccess('Plan assigned successfully.');
      setPlanModalUser(null);
    } catch (err) { setError(err.response?.data?.message || 'Could not assign plan.'); }
    finally { setBillingBusy(null); }
  };


  const recordPayment = async (user) => {
    const sub = user.latestSubscription;
    const payable = Math.max(0, Number(sub?.totalAmount || 0) - Number(sub?.discountAmount || 0));
    const entries = Array.isArray(sub?.paymentEntries) ? sub.paymentEntries.filter(entry => entry.status === 'confirmed') : [];
    const paid = entries.length ? entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) : (['paid','success','completed','partially_paid'].includes(String(sub?.paymentStatus || '').toLowerCase()) ? Number(sub?.amountPaid || 0) : 0);
    const balance = Math.max(0, payable - paid);
    const amount = window.prompt('Payment received (INR). Outstanding: ₹' + balance, '');
    if (amount === null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return;
    const reference = window.prompt('Transaction / receipt reference (optional):', '') || '';
    setBillingBusy(user._id);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/admin/users/' + user._id + '/record-payment', { amount: Number(amount), method: 'manual', reference }, { headers: { Authorization: 'Bearer ' + token } });
      const r = await axios.get('/api/auth/admin/users', { headers: { Authorization: 'Bearer ' + token } });
      setUsers(r.data.users || []); setSuccess('Payment recorded successfully.');
    } catch (err) { setError(err.response?.data?.message || 'Could not record payment.'); }
    finally { setBillingBusy(null); }
  };

  const createClient = async event => {
    event.preventDefault();
    const email = clientForm.email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid client email address."); return; }
    if (clientForm.password.length < 8) { setError("Temporary password must be at least 8 characters."); return; }
    setCreatingClient(true); setError(""); setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("/api/auth/admin/users/create-client", { email, password: clientForm.password }, { headers: { Authorization: "Bearer " + token } });
      setSuccess(response.data?.message || "Client account created successfully.");
      setClientForm({ email: "", password: "" });
      setShowCreateClient(false);
      try {
        const refreshed = await axios.get("/api/auth/admin/users", { headers: { Authorization: "Bearer " + token } });
        setUsers(Array.isArray(refreshed.data?.users) ? refreshed.data.users : []);
      } catch { /* Account creation succeeded; keep the current list if refresh is temporarily unavailable. */ }
    } catch (err) { setError(err.response?.data?.message || "Could not create the client account."); }
    finally { setCreatingClient(false); }
  };
  const getPaidAmount = (sub) => {
    if (!sub) return 0;
    const entries = Array.isArray(sub.paymentEntries) ? sub.paymentEntries.filter(entry => entry.status === 'confirmed') : [];
    if (entries.length) return entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return ['paid','success','completed','partially_paid'].includes(String(sub.paymentStatus || '').toLowerCase()) ? Number(sub.amountPaid || 0) : 0;
  };
  const getPayableAmount = (sub) => Math.max(0, Number(sub?.totalAmount || 0) - Number(sub?.discountAmount || 0));
  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'coadmin', label: 'Co-Admin' },
    { value: 'admin', label: 'Admin' }
  ];

  return (
    <div className="askc-admin-page admin-redesign-page text-slate-800 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 md:mb-0">
          <h2 className="text-blue-700 font-black text-2xl sm:text-3xl">Manage Users</h2>
          <button type="button" onClick={() => setShowCreateClient(true)} className="inline-flex items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-500/20">+ Add New User</button>
          <button type="button" onClick={() => window.dispatchEvent(new Event('askc-open-user-plans'))} className="inline-flex items-center justify-center rounded-xl border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-800 hover:bg-blue-500/20">Subscriptions</button>
        </div>
        <div className="text-sm text-slate-500">
          Showing <span className="text-blue-700 font-bold">{filteredUsers.length}</span> of <span className="text-slate-700 font-bold">{users.length}</span> users
        </div>
      </div>

      {/* Filter Bar */}
      <AdminFilterBar
        onSearch={setSearchTerm}
        onFilterChange={setFilters}
        searchPlaceholder="Search by name or email..."
        filters={[
          {
            key: 'role',
            label: 'Role',
            options: roleOptions
          }
        ]}
        showDateRange={true}
      />
      
      {/* Success Message */}
      {success && (
        <div className="bg-emerald-600 text-slate-900 p-3 sm:p-4 rounded-lg mb-4 flex justify-between items-center animate-fade-in-up">
          <span className="text-sm sm:text-base">{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="bg-transparent border-none text-slate-900 cursor-pointer text-lg hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-rose-600 text-slate-900 p-3 sm:p-4 rounded-lg mb-4 flex justify-between items-center animate-fade-in-up">
          <span className="text-sm sm:text-base">{error}</span>
          <button 
            onClick={() => setError('')}
            className="bg-transparent border-none text-slate-900 cursor-pointer text-lg hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg mb-2">No users found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-slate-800">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-3 text-left border-b border-slate-200 text-sm font-semibold">Name</th>
                    <th className="p-3 text-left border-b border-slate-200 text-sm font-semibold">Email</th>
                    <th className="p-3 text-left border-b border-slate-200 text-sm font-semibold">Role</th><th className="p-3 text-left border-b border-slate-200 text-sm font-semibold">Plan / Payment</th>
                    <th className="p-3 text-left border-b border-slate-200 text-sm font-semibold">Actions</th>
                    <th className="p-3 text-left border-b border-slate-200 text-sm font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="bg-white hover:bg-blue-50 transition-colors">
                      <td className="p-3 border-b border-slate-200 text-sm sm:text-base">{user.name}</td>
                      <td className="p-3 border-b border-slate-200 text-sm sm:text-base break-all">{user.email}</td>
                      <td className="p-3 border-b border-slate-200">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-slate-900 ${
                          user.role === 'admin' ? 'bg-rose-600' : 
                          user.role === 'coadmin' ? 'bg-amber-500' : 
                          'bg-emerald-600'
                        }`}>
                          {user.role === 'coadmin' ? 'Co-Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 border-b border-slate-200 min-w-[220px]">
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-slate-900">{user.latestSubscription ? (user.latestSubscription.status === 'active' && !user.latestSubscription.canceled ? (user.latestSubscription.planName || user.latestSubscription.plan) : 'No active plan · Last: ' + (user.latestSubscription.planName || user.latestSubscription.plan)) : 'No active plan assigned'}</p>
                          <p className="text-slate-500">Original ₹{Number(user.latestSubscription?.totalAmount || 0).toLocaleString('en-IN')} · Discount ₹{Number(user.latestSubscription?.discountAmount || 0).toLocaleString('en-IN')}</p>
                          <p className="text-slate-500">Coupon: {user.latestSubscription?.couponCode || 'No coupon'} · Received ₹{getPaidAmount(user.latestSubscription).toLocaleString('en-IN')} · Due ₹{Math.max(0, getPayableAmount(user.latestSubscription) - getPaidAmount(user.latestSubscription)).toLocaleString('en-IN')}</p>
                          <p className="text-slate-500 break-all">Transaction: {user.latestSubscription?.transactionId || user.latestSubscription?.cashfreeOrderId || '—'}</p>
                          <p className="text-slate-500">Plan status: <span className="capitalize">{user.latestSubscription?.canceled ? 'cancelled' : user.latestSubscription?.status || 'No active plan'}</span></p>
                          {user.latestSubscription?.canceled && <p className="text-slate-500">Cancelled by: <span className="font-semibold text-amber-800">{user.latestSubscription.cancellationInitiatedBy === 'askc' ? 'ASKC TECHNOLOGIES' : user.latestSubscription.cancellationInitiatedBy === 'user' ? 'Self (User)' : 'Not recorded'}</span></p>}
                          {user.latestSubscription?.canceled && <p className="text-slate-500">Refund status: <span className="capitalize">{String(user.latestSubscription.refundStatus || 'not_reviewed').replace(/_/g, ' ')}</span></p>}
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => openAssignPlan(user)} disabled={billingBusy === user._id} className="rounded-lg bg-blue-600 px-2 py-1.5 font-bold text-white disabled:opacity-50">{user.latestSubscription ? 'Change plan' : 'Assign plan'}</button>
                            {user.latestSubscription && <button onClick={() => recordPayment(user)} disabled={billingBusy === user._id} className="rounded-lg bg-emerald-600 px-2 py-1.5 font-bold text-white disabled:opacity-50">Add payment</button>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={changingRole === user._id}
                            className="px-2 py-1 rounded bg-white text-slate-800 border border-gray-600 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-blue-50 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="coadmin">Co-Admin</option>
                            <option value="admin">Admin</option>
                          </select>
                          {changingRole === user._id && (
                            <span className="text-xs text-slate-500">Updating...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-b border-slate-200 text-sm text-slate-500">
                        {user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map(user => (
                <div key={user._id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-slate-900 font-semibold text-base">{user.name}</h3>
                      <p className="text-slate-500 text-sm break-all mt-1">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-slate-900 ${
                      user.role === 'admin' ? 'bg-rose-600' : 
                      user.role === 'coadmin' ? 'bg-amber-500' : 
                      'bg-emerald-600'
                    }`}>
                      {user.role === 'coadmin' ? 'Co-Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-xs font-bold text-slate-600">Plan & payment</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{user.latestSubscription?.planName || 'No plan assigned'}</p>
                    <p className="text-xs text-slate-500">Original ₹{Number(user.latestSubscription?.totalAmount || 0).toLocaleString('en-IN')} · Discount ₹{Number(user.latestSubscription?.discountAmount || 0).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500">Coupon: {user.latestSubscription?.couponCode || 'No coupon'} · Received ₹{getPaidAmount(user.latestSubscription).toLocaleString('en-IN')} · Due ₹{Math.max(0, getPayableAmount(user.latestSubscription) - getPaidAmount(user.latestSubscription)).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500 break-all">Transaction: {user.latestSubscription?.transactionId || user.latestSubscription?.cashfreeOrderId || '—'}</p>
                    <p className="text-xs text-slate-500">Plan status: <span className="capitalize">{user.latestSubscription?.canceled ? 'cancelled' : user.latestSubscription?.status || 'No active plan'}</span></p>
                    {user.latestSubscription?.canceled && <p className="text-xs text-slate-500">Cancelled by: <span className="font-semibold text-amber-800">{user.latestSubscription.cancellationInitiatedBy === 'askc' ? 'ASKC TECHNOLOGIES' : user.latestSubscription.cancellationInitiatedBy === 'user' ? 'Self (User)' : 'Not recorded'}</span></p>}
                    {user.latestSubscription?.canceled && <p className="text-xs text-slate-500">Refund status: <span className="capitalize">{String(user.latestSubscription.refundStatus || 'not_reviewed').replace(/_/g, ' ')}</span></p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button onClick={() => openAssignPlan(user)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">{user.latestSubscription ? 'Change plan' : 'Assign plan'}</button>
                      {user.latestSubscription && <button onClick={() => recordPayment(user)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Add payment</button>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-500 block mb-1">Change Role</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={changingRole === user._id}
                        className="w-full px-3 py-2 rounded bg-white text-slate-800 border border-gray-600 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="coadmin">Co-Admin</option>
                        <option value="admin">Admin</option>
                      </select>
                      {changingRole === user._id && (
                        <span className="text-xs text-slate-500 mt-1 block">Updating...</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Registered: {user.createdAt ? new Date(user.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {showCreateClient && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-slate-950/75 p-3 sm:p-5" onClick={() => !creatingClient && setShowCreateClient(false)}>
          <form onSubmit={createClient} onClick={event => event.stopPropagation()} className="w-full max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">ASKC TECHNOLOGIES</p><h3 className="mt-1 text-xl font-extrabold">Create client account</h3><p className="mt-1 text-sm text-slate-500">Create login credentials. The client must replace the temporary password at first login.</p></div>
              <button type="button" onClick={() => setShowCreateClient(false)} disabled={creatingClient} className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Close">×</button>
            </div>
            <label className="block text-sm font-bold">Client email address
              <input type="email" required maxLength="254" autoComplete="email" value={clientForm.email} onChange={event => setClientForm(current => ({ ...current, email: event.target.value }))} placeholder="client@example.com" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="block text-sm font-bold">Temporary password
              <input type="password" required minLength="8" maxLength="128" autoComplete="new-password" value={clientForm.password} onChange={event => setClientForm(current => ({ ...current, password: event.target.value }))} placeholder="At least 8 characters" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Share these temporary credentials with the client securely. The client cannot access the dashboard until a new password is saved.</div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowCreateClient(false)} disabled={creatingClient} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">Cancel</button><button type="submit" disabled={creatingClient || !clientForm.email.trim() || clientForm.password.length < 8} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{creatingClient ? "Creating…" : "Create Client"}</button></div>
          </form>
        </div>
      )}
      {planModalUser && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-950/75 p-3 sm:p-5" onClick={() => !billingBusy && setPlanModalUser(null)}>
          <form onSubmit={assignPlan} onClick={e => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">ASKC Technologies · Subscription</p><h3 className="mt-1 text-xl font-extrabold">{planModalUser.latestSubscription ? 'Assign / Change Plan' : 'Assign New Plan'}</h3><p className="mt-1 text-sm text-slate-500">{planModalUser.name} · {planModalUser.email}</p></div>
              <button type="button" onClick={() => setPlanModalUser(null)} className="rounded-lg px-3 py-1 text-2xl text-slate-500 hover:bg-slate-100" aria-label="Close">×</button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-bold">Select from Existing Plans
                <select value={planChoice} onChange={e => {
                  const value = e.target.value;
                  setPlanChoice(value);
                  if (value === 'others') { setPlanForm(v => ({...v, planName: 'Custom Plan'})); return; }
                  const selected = existingPlans.find(p => p._id === value);
                  if (selected) {
                    const price = Number(String(selected.price || '').replace(/[^0-9.]/g, ''));
                    const durationParts = String(selected.duration || '').match(/[0-9]+/g) || ['30'];
                    const duration = Number(durationParts[durationParts.length - 1]);
                    setPlanForm(v => ({...v, planName: selected.name, totalAmount: Number.isFinite(price) ? String(price) : '0', durationDays: String(duration)}));
                  }
                }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">
                  <option value="">Choose a plan…</option>
                  {existingPlans.map(plan => <option key={plan._id} value={plan._id}>{plan.name} — {plan.price} · {plan.duration} days</option>)}
                  <option value="others">Others — Create a custom plan</option>
                </select>
              </label>
              {planChoice === 'others' && <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800">Custom plan selected. Enter the plan name, amount and validity below.</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold sm:col-span-2">Plan name
                <input required maxLength="100" value={planForm.planName} readOnly={planChoice !== "others"} onChange={e => setPlanForm(v => ({...v,planName:e.target.value}))} placeholder="e.g. Website Development Plan" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
              </label>
              <label className="text-sm font-bold">Total amount (₹)
                <input required type="number" min="0" step="0.01" value={planForm.totalAmount} readOnly={planChoice !== "others"} onChange={e => setPlanForm(v => ({...v,totalAmount:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
              </label>
              <label className="text-sm font-bold">Validity (days)
                <input required type="number" min="1" max="3650" step="1" value={planForm.durationDays} readOnly={planChoice !== "others"} onChange={e => setPlanForm(v => ({...v,durationDays:e.target.value}))} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
              </label>
              <label className="text-sm font-bold sm:col-span-2">Admin note (optional)
                <textarea rows="3" maxLength="500" value={planForm.note} onChange={e => setPlanForm(v => ({...v,note:e.target.value}))} placeholder="Scope, milestone, or internal note…" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
              </label>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">A new subscription record will be created. Existing subscription history will remain available in User Plans.</div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setPlanModalUser(null)} className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700">Cancel</button><button disabled={billingBusy === planModalUser._id} className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{billingBusy === planModalUser._id ? 'Saving…' : 'Assign Plan'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 