import React, { useEffect, useState } from 'react';
import axios from '../axios';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [changingRole, setChangingRole] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data.users);
      } catch (err) {
        setError('Could not fetch users.');
      }
      setLoading(false);
    };
    fetchUsers();
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

  return (
    <div style={{ color: '#E5E7EB', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: '#2ECC71', fontWeight: 700, fontSize: '1.7rem', marginBottom: '1.2rem' }}>Manage Users</h2>
      
      {/* Success Message */}
      {success && (
        <div style={{ 
          background: '#10B981', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {success}
          <button 
            onClick={() => setSuccess('')}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{ 
          background: '#EF4444', 
          color: 'white', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}
      
      <div style={{ background: '#23272F', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        {loading ? (
          <div>Loading...</div>
        ) : users.length === 0 ? (
          <div>No users found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#E5E7EB' }}>
            <thead>
              <tr style={{ background: '#181A20' }}>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Name</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Email</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Role</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Actions</th>
                <th style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} style={{ background: '#23272F' }}>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{user.name}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{user.email}</td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '0.25rem', 
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      background: user.role === 'admin' 
                        ? '#DC2626' 
                        : user.role === 'coadmin' 
                        ? '#F59E0B' 
                        : '#059669',
                      color: 'white'
                    }}>
                      {user.role === 'coadmin' ? 'Co-Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      disabled={changingRole === user._id}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        background: '#374151',
                        color: '#E5E7EB',
                        border: '1px solid #4B5563',
                        cursor: changingRole === user._id ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="coadmin">Co-Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                    {changingRole === user._id && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#9CA3AF' }}>
                        Updating...
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.7rem', borderBottom: '1px solid #333' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminUsers; 