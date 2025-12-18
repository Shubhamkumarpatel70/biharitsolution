import React, { useEffect, useState, useMemo } from 'react';
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

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

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

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'coadmin', label: 'Co-Admin' },
    { value: 'admin', label: 'Admin' }
  ];

  return (
    <div className="text-gray-200 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-success-500 font-black text-2xl sm:text-3xl mb-4 md:mb-0">Manage Users</h2>
        <div className="text-sm text-gray-400">
          Showing <span className="text-success-400 font-bold">{filteredUsers.length}</span> of <span className="text-gray-300 font-bold">{users.length}</span> users
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
        <div className="bg-green-600 text-white p-3 sm:p-4 rounded-lg mb-4 flex justify-between items-center animate-fade-in-up">
          <span className="text-sm sm:text-base">{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="bg-transparent border-none text-white cursor-pointer text-lg hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-600 text-white p-3 sm:p-4 rounded-lg mb-4 flex justify-between items-center animate-fade-in-up">
          <span className="text-sm sm:text-base">{error}</span>
          <button 
            onClick={() => setError('')}
            className="bg-transparent border-none text-white cursor-pointer text-lg hover:opacity-80 transition-opacity"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg mb-2">No users found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse text-gray-200">
                <thead>
                  <tr className="bg-gray-900">
                    <th className="p-3 text-left border-b border-gray-700 text-sm font-semibold">Name</th>
                    <th className="p-3 text-left border-b border-gray-700 text-sm font-semibold">Email</th>
                    <th className="p-3 text-left border-b border-gray-700 text-sm font-semibold">Role</th>
                    <th className="p-3 text-left border-b border-gray-700 text-sm font-semibold">Actions</th>
                    <th className="p-3 text-left border-b border-gray-700 text-sm font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id} className="bg-gray-800 hover:bg-gray-750 transition-colors">
                      <td className="p-3 border-b border-gray-700 text-sm sm:text-base">{user.name}</td>
                      <td className="p-3 border-b border-gray-700 text-sm sm:text-base break-all">{user.email}</td>
                      <td className="p-3 border-b border-gray-700">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white ${
                          user.role === 'admin' ? 'bg-red-600' : 
                          user.role === 'coadmin' ? 'bg-amber-500' : 
                          'bg-green-600'
                        }`}>
                          {user.role === 'coadmin' ? 'Co-Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="p-3 border-b border-gray-700">
                        <div className="flex items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            disabled={changingRole === user._id}
                            className="px-2 py-1 rounded bg-gray-700 text-gray-200 border border-gray-600 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-600 transition-colors"
                          >
                            <option value="user">User</option>
                            <option value="coadmin">Co-Admin</option>
                            <option value="admin">Admin</option>
                          </select>
                          {changingRole === user._id && (
                            <span className="text-xs text-gray-400">Updating...</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-b border-gray-700 text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map(user => (
                <div key={user._id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-base">{user.name}</h3>
                      <p className="text-gray-400 text-sm break-all mt-1">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${
                      user.role === 'admin' ? 'bg-red-600' : 
                      user.role === 'coadmin' ? 'bg-amber-500' : 
                      'bg-green-600'
                    }`}>
                      {user.role === 'coadmin' ? 'Co-Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Change Role</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={changingRole === user._id}
                        className="w-full px-3 py-2 rounded bg-gray-700 text-gray-200 border border-gray-600 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="coadmin">Co-Admin</option>
                        <option value="admin">Admin</option>
                      </select>
                      {changingRole === user._id && (
                        <span className="text-xs text-gray-400 mt-1 block">Updating...</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers; 