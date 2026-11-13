import React, { useState, useEffect } from 'react';
import axios from '../axios';

const AdminPaymentOptions = () => {
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    upiId: '',
    description: '',
    paymentType: 'UPI',
    order: 0
  });

  useEffect(() => {
    fetchPaymentOptions();
  }, []);

  const fetchPaymentOptions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/admin/payment-options');
      setPaymentOptions(response.data.paymentOptions);
    } catch (err) {
      setError('Failed to fetch payment options');
      console.error('Error fetching payment options:', err);
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

  const resetForm = () => {
    setFormData({
      name: '',
      upiId: '',
      description: '',
      paymentType: 'UPI',
      order: 0
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (editingId) {
        await axios.put(`/api/auth/admin/payment-options/${editingId}`, formData);
        setSuccess('Payment option updated successfully!');
      } else {
        await axios.post('/api/auth/admin/payment-options', formData);
        setSuccess('Payment option added successfully!');
      }

      resetForm();
      fetchPaymentOptions();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save payment option');
      console.error('Error saving payment option:', err);
    }
  };

  const handleEdit = (option) => {
    setFormData({
      name: option.name,
      upiId: option.upiId,
      description: option.description || '',
      paymentType: option.paymentType,
      order: option.order
    });
    setEditingId(option._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment option?')) {
      return;
    }

    try {
      await axios.delete(`/api/auth/admin/payment-options/${id}`);
      setSuccess('Payment option deleted successfully!');
      fetchPaymentOptions();
    } catch (err) {
      setError('Failed to delete payment option');
      console.error('Error deleting payment option:', err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  if (loading) {
    return (
    <div className="admin-redesign-page" style={{ textAlign: 'center', padding: '2rem', color: '#E5E7EB' }}>
        Loading payment options...
      </div>
    );
  }

  return (
    <div style={{ color: '#E5E7EB', padding: '2rem' }}>
      <h1 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '2rem', marginBottom: '2rem' }}>
        Payment Options Management
      </h1>

      {error && (
        <div style={{
          background: '#DC2626',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: '#059669',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      <div style={{
        background: '#23272F',
        borderRadius: '1rem',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#2ECC71', marginBottom: '1.5rem' }}>
          {editingId ? 'Edit Payment Option' : 'Add New Payment Option'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#E5E7EB' }}>
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #4B5563',
                  background: '#374151',
                  color: '#E5E7EB'
                }}
                placeholder="e.g., Google Pay, PhonePe"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#E5E7EB' }}>
                UPI ID *
              </label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #4B5563',
                  background: '#374151',
                  color: '#E5E7EB'
                }}
                placeholder="e.g., customweb@upi"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#E5E7EB' }}>
                Payment Type
              </label>
              <select
                name="paymentType"
                value={formData.paymentType}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #4B5563',
                  background: '#374151',
                  color: '#E5E7EB'
                }}
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#E5E7EB' }}>
                Order
              </label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #4B5563',
                  background: '#374151',
                  color: '#E5E7EB'
                }}
                placeholder="0"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#E5E7EB' }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #4B5563',
                background: '#374151',
                color: '#E5E7EB',
                resize: 'vertical'
              }}
              placeholder="Optional description for this payment option"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              style={{
                background: '#2ECC71',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {editingId ? 'Update Payment Option' : 'Add Payment Option'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  background: '#6B7280',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Payment Options List */}
      <div style={{
        background: '#23272F',
        borderRadius: '1rem',
        padding: '2rem'
      }}>
        <h2 style={{ color: '#2ECC71', marginBottom: '1.5rem' }}>
          Payment Options ({paymentOptions.length})
        </h2>

        {paymentOptions.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>
            No payment options found. Add your first payment option above.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {paymentOptions.map((option) => (
              <div
                key={option._id}
                style={{
                  background: '#374151',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '1px solid #4B5563'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ color: '#E5E7EB', marginBottom: '0.5rem' }}>
                      {option.name}
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        background: option.isActive ? '#059669' : '#DC2626',
                        color: 'white'
                      }}>
                        {option.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </h3>
                    <div style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                      <strong>UPI ID:</strong> {option.upiId}
                    </div>
                    <div style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                      <strong>Type:</strong> {option.paymentType}
                    </div>
                    {option.description && (
                      <div style={{ color: '#9CA3AF', marginBottom: '0.5rem' }}>
                        <strong>Description:</strong> {option.description}
                      </div>
                    )}
                    <div style={{ color: '#9CA3AF' }}>
                      <strong>Order:</strong> {option.order}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => copyToClipboard(option.upiId)}
                      style={{
                        background: '#3B82F6',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Copy UPI ID
                    </button>
                    <button
                      onClick={() => handleEdit(option)}
                      style={{
                        background: '#F59E0B',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(option._id)}
                      style={{
                        background: '#DC2626',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentOptions;
