import React, { useState, useEffect } from 'react';
import axios from '../axios';

const AdminFeatures = () => {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: '',
    category: 'other',
    order: 0,
    color: '#667eea',
    benefits: []
  });

  const categories = [
    { value: 'web', label: 'Web Development' },
    { value: 'mobile', label: 'Mobile Development' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/admin/features', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort features by order
      const sortedFeatures = (Array.isArray(response.data?.features) ? response.data.features : []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setFeatures(sortedFeatures);
    } catch (err) {
      setError('Failed to fetch features');
      console.error('Error fetching features:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBenefitsChange = (e) => {
    const benefits = e.target.value.split('\n').filter(benefit => benefit.trim());
    setFormData(prev => ({
      ...prev,
      benefits
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: '',
      category: 'other',
      order: 0,
      color: '#667eea',
      benefits: []
    });
    setEditingFeature(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        ...formData,
        benefits: formData.benefits
      };

      if (editingFeature) {
        await axios.put(`/api/auth/admin/features/${editingFeature._id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/auth/admin/features', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchFeatures();
      resetForm();
      setError('');
      setSuccess(editingFeature ? 'Feature updated successfully!' : 'Feature added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving feature:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid data provided.');
      } else {
        setError(err.response?.data?.message || 'Failed to save feature. Please try again.');
      }
    }
  };

  const handleEdit = (feature) => {
    setEditingFeature(feature);
    setFormData({
      title: feature.title || '',
      description: feature.description || '',
      icon: feature.icon || '',
      category: feature.category || 'other',
      order: feature.order || 0,
      color: feature.color || '#667eea',
      benefits: Array.isArray(feature.benefits) ? feature.benefits : []
    });
    setShowAddForm(true);
  };

  const handleDelete = async (featureId) => {
    const feature = features.find(f => f._id === featureId);
    const featureName = feature ? feature.title : 'this feature';
    
    if (!window.confirm(`Are you sure you want to delete ${featureName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/admin/features/${featureId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFeatures();
      setSuccess('Feature deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting feature:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to delete features.');
      } else if (err.response?.status === 404) {
        setError('Feature not found.');
      } else {
        setError('Failed to delete feature. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading features...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-400">Feature Management</h1>
            <p className="text-gray-400 mt-2">Manage your features, their descriptions, and categories</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Add Feature
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
            {success}
            <button
              onClick={() => setSuccess('')}
              className="float-right text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-400">
              {editingFeature ? 'Edit Feature' : 'Add New Feature'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Icon *</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    required
                    placeholder="🚀"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe this feature..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Benefits (one per line)</label>
                <textarea
                  name="benefits"
                  value={formData.benefits.join('\n')}
                  onChange={handleBenefitsChange}
                  rows="4"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Benefit 1&#10;Benefit 2&#10;Benefit 3"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {editingFeature ? 'Update Feature' : 'Add Feature'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature._id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${feature.color}20`, border: `2px solid ${feature.color}` }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-emerald-400 text-sm">{feature.category}</p>
                    <p className="text-gray-500 text-sm">Order: {feature.order || 0}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(feature)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(feature._id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-gray-300 text-sm mb-4">{feature.description}</p>

              {feature.benefits && feature.benefits.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-emerald-400">Benefits:</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {feature.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-emerald-400 mr-2">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {features.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Features Yet</h3>
            <p className="text-gray-500">Add your first feature to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeatures;
