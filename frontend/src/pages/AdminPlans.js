import React, { useEffect, useState } from 'react';
import axios from '../axios';

const defaultPlan = {
  name: '', price: '', oldPrice: '', savings: '', features: '', highlight: false, color: '', duration: ''
};

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(defaultPlan);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchPlans = async () => {
    const res = await axios.get('/api/auth/plans');
    setPlans(res.data.plans);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const data = { ...form, features: form.features.split(',').map(f => f.trim()) };
      if (editingId) {
        await axios.put(`/api/auth/plans/${editingId}`, data, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Plan updated!');
      } else {
        await axios.post('/api/auth/plans', data, { headers: { Authorization: `Bearer ${token}` } });
        setMessage('Plan added!');
      }
      setForm(defaultPlan);
      setEditingId(null);
      fetchPlans();
    } catch (err) {
      setMessage('Error saving plan.');
    }
  };

  const handleEdit = plan => {
    setForm({ ...plan, features: plan.features.join(', ') });
    setEditingId(plan._id);
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/plans/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Plan deleted!');
      fetchPlans();
    } catch {
      setMessage('Could not delete plan.');
    }
  };

  // Sort plans: highlighted first
  const sortedPlans = [...plans].sort((a, b) => (b.highlight === a.highlight) ? 0 : b.highlight ? -1 : 1);

  return (
    <div style={{ color: '#E5E7EB', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>Manage Plans</h2>
      <form onSubmit={handleSubmit} style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required style={{ flex: 1 }} />
          <input name="price" value={form.price} onChange={handleChange} placeholder="Price" required style={{ flex: 1 }} />
          <input name="oldPrice" value={form.oldPrice} onChange={handleChange} placeholder="Old Price" style={{ flex: 1 }} />
          <input name="savings" value={form.savings} onChange={handleChange} placeholder="Savings" style={{ flex: 1 }} />
          <input name="color" value={form.color} onChange={handleChange} placeholder="Color (e.g. #2ECC71)" style={{ flex: 1 }} />
          <input name="duration" type="number" value={form.duration || ''} onChange={handleChange} placeholder="Duration (days)" required style={{ flex: 1 }} />
        </div>
        <div style={{ margin: '1rem 0' }}>
          <input name="features" value={form.features} onChange={handleChange} placeholder="Features (comma separated)" style={{ width: '100%' }} />
        </div>
        <label style={{ display: 'block', marginBottom: '1rem' }}>
          <input type="checkbox" name="highlight" checked={form.highlight} onChange={handleChange} /> Highlight
        </label>
        <button type="submit" style={{ background: '#2ECC71', color: '#181A20', border: 'none', borderRadius: '0.5rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>{editingId ? 'Update' : 'Add'} Plan</button>
        {message && <span style={{ marginLeft: '1rem', color: '#2ECC71' }}>{message}</span>}
      </form>
      <h3 style={{ color: '#2ECC71', fontWeight: 600, marginBottom: '1rem' }}>Existing Plans</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {sortedPlans.map(plan => (
          <li key={plan._id} style={{
            background: plan.highlight ? '#23272F' : '#181A20',
            border: plan.highlight ? '2px solid #2ECC71' : '2px solid transparent',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            position: 'relative'
          }}>
            {plan.highlight && (
              <span style={{
                position: 'absolute',
                top: 10,
                right: 20,
                background: '#2ECC71',
                color: '#181A20',
                borderRadius: '12px',
                padding: '2px 10px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                Highlighted
              </span>
            )}
            <b>{plan.name}</b> - {plan.price} <span style={{ color: plan.color }}>{plan.savings}</span>
            <div style={{ fontSize: '0.95rem', color: '#A0AEC0' }}>Features: {plan.features.join(', ')}</div>
            <div style={{ fontSize: '0.95rem', color: '#A0AEC0' }}>Duration: {plan.duration} days</div>
            <button onClick={() => handleEdit(plan)} style={{ background: '#0057D9', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.3rem 1rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer', marginRight: '0.5rem' }}>Edit</button>
            <button onClick={() => handleDelete(plan._id)} style={{ background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.3rem 1rem', fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer' }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPlans; 