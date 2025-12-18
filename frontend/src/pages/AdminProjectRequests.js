import React, { useState, useEffect } from 'react';
import axios from '../axios';

const statusLabels = {
  pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-100', icon: '⏳' },
  under_review: { label: 'Under Review', color: 'text-blue-600 bg-blue-100', icon: '🔍' },
  under_development: { label: 'Under Development', color: 'text-purple-600 bg-purple-100', icon: '🚧' },
  last_stage: { label: 'Last Stage of Development', color: 'text-orange-600 bg-orange-100', icon: '⚡' },
  finished: { label: 'Finished', color: 'text-green-600 bg-green-100', icon: '✅' },
};

const AdminProjectRequests = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    status: '',
    projectLink: '',
    adminNotes: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [filterStatus, searchQuery]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (searchQuery) params.append('search', searchQuery);
      
      const queryString = params.toString();
      const url = `/api/auth/admin/project-requirements${queryString ? `?${queryString}` : ''}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data.projectRequirements || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Could not fetch project requirements.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project._id);
    setEditData({
      status: project.status,
      projectLink: project.projectLink || '',
      adminNotes: project.adminNotes || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ status: '', projectLink: '', adminNotes: '' });
  };

  const handleUpdate = async (id) => {
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/project-requirement/${id}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Project requirement updated successfully!');
      setEditingId(null);
      setEditData({ status: '', projectLink: '', adminNotes: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update project requirement.');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <h2 className="text-2xl md:text-3xl font-bold text-success-500 mb-6">Project Requests</h2>
      
      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-success-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="under_development">Under Development</option>
              <option value="last_stage">Last Stage</option>
              <option value="finished">Finished</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project idea or preference..."
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-success-500"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
          {success}
        </div>
      )}

      {/* Projects List */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-success-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-gray-400 text-center py-12">No project requirements found.</div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const statusInfo = statusLabels[project.status] || statusLabels.pending;
              const isEditing = editingId === project._id;
              
              return (
                <div key={project._id} className="bg-gray-700 rounded-xl p-6 border border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">User:</span>
                        <span className="text-white ml-2 font-medium">
                          {project.user?.name} ({project.user?.email})
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Status:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color} inline-flex items-center gap-1`}>
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-400 text-sm">Submitted:</span>
                        <span className="text-gray-300 ml-2 text-sm">{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div>
                      {project.projectLink && (
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Project Link:</span>
                          <a 
                            href={project.projectLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-success-500 ml-2 hover:underline"
                          >
                            {project.projectLink}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-gray-300 font-semibold mb-2">Project Idea:</h3>
                    <p className="text-white whitespace-pre-wrap bg-gray-800 p-4 rounded-lg border border-gray-600">
                      {project.projectIdea}
                    </p>
                  </div>

                  {project.websitePreference && (
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Website Preference: </span>
                      <span className="text-white">{project.websitePreference}</span>
                    </div>
                  )}

                  {project.linkOption && (
                    <div className="mb-2">
                      <span className="text-gray-400 text-sm">Reference Link: </span>
                      <a 
                        href={project.linkOption} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-success-500 hover:underline"
                      >
                        {project.linkOption}
                      </a>
                    </div>
                  )}

                  {project.adminNotes && !isEditing && (
                    <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                      <span className="text-sm font-medium text-blue-300">Admin Notes: </span>
                      <span className="text-blue-200">{project.adminNotes}</span>
                    </div>
                  )}

                  {/* Edit Form */}
                  {isEditing ? (
                    <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
                      <h4 className="text-white font-semibold mb-4">Update Status</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-success-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="under_review">Under Review</option>
                            <option value="under_development">Under Development</option>
                            <option value="last_stage">Last Stage of Development</option>
                            <option value="finished">Finished</option>
                          </select>
                        </div>

                        {editData.status === 'finished' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Project Link <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="url"
                              value={editData.projectLink}
                              onChange={(e) => setEditData({ ...editData, projectLink: e.target.value })}
                              placeholder="https://example.com"
                              required
                              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-success-500"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                          <textarea
                            value={editData.adminNotes}
                            onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-success-500 resize-none"
                            placeholder="Add notes for the user..."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleUpdate(project._id)}
                            className="px-6 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-semibold transition-colors"
                          >
                            Update
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <button
                        onClick={() => handleEdit(project)}
                        className="px-6 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg font-semibold transition-colors"
                      >
                        Update Status
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProjectRequests;

