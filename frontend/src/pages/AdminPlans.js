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
    <div className="text-gray-200 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <h2 className="text-green-500 font-bold text-2xl sm:text-3xl mb-4 sm:mb-6">Manage Plans</h2>
      
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="Name" 
            required 
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input 
            name="price" 
            value={form.price} 
            onChange={handleChange} 
            placeholder="Price" 
            required 
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input 
            name="oldPrice" 
            value={form.oldPrice} 
            onChange={handleChange} 
            placeholder="Old Price" 
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input 
            name="savings" 
            value={form.savings} 
            onChange={handleChange} 
            placeholder="Savings" 
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input 
            name="color" 
            value={form.color} 
            onChange={handleChange} 
            placeholder="Color (e.g. #2ECC71)" 
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input 
            name="duration" 
            type="number" 
            value={form.duration || ''} 
            onChange={handleChange} 
            placeholder="Duration (days)" 
            required 
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="mb-4">
          <input 
            name="features" 
            value={form.features} 
            onChange={handleChange} 
            placeholder="Features (comma separated)" 
            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input 
            type="checkbox" 
            name="highlight" 
            checked={form.highlight} 
            onChange={handleChange}
            className="w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
          />
          <span className="text-gray-300">Highlight this plan</span>
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button 
            type="submit" 
            className="bg-green-500 hover:bg-green-600 text-gray-900 border-none rounded-lg px-6 py-2.5 font-bold text-base cursor-pointer transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {editingId ? 'Update' : 'Add'} Plan
          </button>
          {message && (
            <span className={`text-sm sm:text-base ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </span>
          )}
        </div>
      </form>
      
      <h3 className="text-green-500 font-semibold text-xl sm:text-2xl mb-4">Existing Plans</h3>
      <div className="space-y-4">
        {sortedPlans.map(plan => (
          <div 
            key={plan._id} 
            className={`rounded-lg p-4 sm:p-6 relative transition-all duration-200 ${
              plan.highlight 
                ? 'bg-gray-800 border-2 border-green-500 shadow-lg shadow-green-500/20' 
                : 'bg-gray-900 border-2 border-transparent hover:border-gray-700'
            }`}
          >
            {plan.highlight && (
              <span className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-green-500 text-gray-900 rounded-full px-3 py-1 text-xs font-bold">
                Highlighted
              </span>
            )}
            <div className="pr-20 sm:pr-24">
              <h4 className="text-white font-bold text-lg sm:text-xl mb-2">
                {plan.name} - {plan.price} 
                {plan.savings && (
                  <span className="ml-2" style={{ color: plan.color || '#2ECC71' }}>
                    {plan.savings}
                  </span>
                )}
              </h4>
              <div className="text-sm sm:text-base text-gray-400 mb-2">
                <strong>Features:</strong> {plan.features.join(', ')}
              </div>
              <div className="text-sm sm:text-base text-gray-400 mb-4">
                <strong>Duration:</strong> {plan.duration} days
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => handleEdit(plan)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg px-4 py-2 font-semibold text-sm cursor-pointer transition-colors duration-200"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(plan._id)} 
                  className="bg-red-600 hover:bg-red-700 text-white border-none rounded-lg px-4 py-2 font-semibold text-sm cursor-pointer transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPlans; 