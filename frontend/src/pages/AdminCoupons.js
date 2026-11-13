import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', amount: '', usageLimit: '' });
  const [msg, setMsg] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(res.data.coupons);
    } catch (err) {
      setError('Could not fetch coupons.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/coupons', {
        code: form.code,
        amount: Number(form.amount),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Coupon created!');
      setForm({ code: '', amount: '', usageLimit: '' });
      fetchCoupons();
    } catch (err) {
      setMsg('Could not create coupon.');
    }
  };

  const handleDeactivate = async (id) => {
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/coupons/${id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Coupon deactivated!');
      fetchCoupons();
    } catch {
      setMsg('Could not deactivate coupon.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg('Coupon deleted!');
      fetchCoupons();
    } catch {
      setMsg('Could not delete coupon.');
    }
  };

  return (
    <div className="admin-redesign-page" style={{ color: '#E5E7EB', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>Coupons</h2>
      <form onSubmit={handleSubmit} style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input name="code" value={form.code} onChange={handleChange} placeholder="Coupon Code" required style={{ flex: 1 }} />
          <input name="amount" value={form.amount} onChange={handleChange} placeholder="Discount Amount" required type="number" style={{ flex: 1 }} />
          <input name="usageLimit" value={form.usageLimit} onChange={handleChange} placeholder="Usage Limit (optional)" type="number" style={{ flex: 1 }} />
        </div>
        <button type="submit" style={{ background: '#2ECC71', color: '#181A20', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}>Create Coupon</button>
        {msg && <span style={{ marginLeft: '1rem', color: '#2ECC71' }}>{msg}</span>}
      </form>
      <h3 style={{ color: '#2ECC71', fontWeight: 600, marginBottom: '1rem' }}>All Coupons</h3>
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div style={{ color: '#FF6B35' }}>{error}</div>
        ) : coupons.length === 0 ? (
          <div>No coupons found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#E5E7EB' }}>
            <thead>
              <tr style={{ background: '#181A20' }}>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Code</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Amount</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Usage Limit</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Used</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Active</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Created At</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon._id}>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{coupon.code}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>₹{coupon.amount}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{coupon.usageLimit || '∞'}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{coupon.usedCount}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333', color: coupon.active ? '#2ECC71' : '#FF6B35', fontWeight: 700 }}>{coupon.active ? 'Active' : 'Inactive'}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{new Date(coupon.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>
                    <button onClick={() => handleDeactivate(coupon._id)} disabled={!coupon.active} style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '0.3rem', padding: '0.3rem 0.8rem', cursor: coupon.active ? 'pointer' : 'not-allowed', marginRight: 8 }}>Deactivate</button>
                    <button onClick={() => handleDelete(coupon._id)} style={{ background: '#A0AEC0', color: '#181A20', border: 'none', borderRadius: '0.3rem', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons; 