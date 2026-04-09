import React, { useState, useEffect } from 'react';
import axios from '../axios';

const statusLabels = {
  pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-100', icon: '⏳' },
  under_review: { label: 'Under Review', color: 'text-blue-600 bg-blue-100', icon: '🔍' },
  under_development: { label: 'Under Development', color: 'text-purple-600 bg-purple-100', icon: '🚧' },
  last_stage: { label: 'Last Stage of Development', color: 'text-orange-600 bg-orange-100', icon: '⚡' },
  finished: { label: 'Finished', color: 'text-green-600 bg-green-100', icon: '✅' },
};

function formatDateOnly(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getTimelineEntries(project) {
  const raw = project.statusTimeline;
  if (Array.isArray(raw) && raw.length > 0) {
    return [...raw].sort((a, b) => new Date(a.at) - new Date(b.at));
  }
  const entries = [{ status: 'pending', at: project.createdAt }];
  if (project.status !== 'pending') {
    entries.push({ status: project.status, at: project.updatedAt || project.createdAt });
  }
  return entries;
}

function timelineStepTitle(status, index) {
  if (index === 0 && status === 'pending') return 'Requirement submitted';
  if (status === 'finished') return 'Project delivered';
  return `Status updated — ${statusLabels[status]?.label || status}`;
}

const AdminProjectRequests = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    status: '',
    projectLink: '',
    adminNotes: '',
    estimatedCompletionDate: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, projects.length]);

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
    const est = project.estimatedCompletionDate
      ? new Date(project.estimatedCompletionDate).toISOString().slice(0, 10)
      : '';
    setEditData({
      status: project.status,
      projectLink: project.projectLink || '',
      adminNotes: project.adminNotes || '',
      estimatedCompletionDate: est,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ status: '', projectLink: '', adminNotes: '', estimatedCompletionDate: '' });
  };

  const handleUpdate = async (id, project) => {
    setError('');
    setSuccess('');

    const movingOffPending = project.status === 'pending' && editData.status !== 'pending';
    const hasEst =
      (editData.estimatedCompletionDate && editData.estimatedCompletionDate.trim()) ||
      project.estimatedCompletionDate;
    if (movingOffPending && !hasEst) {
      setError('Set an estimated completion date before moving this request out of pending.');
      return;
    }

    const payload = {
      status: editData.status,
      adminNotes: editData.adminNotes,
      estimatedCompletionDate: editData.estimatedCompletionDate?.trim() || null,
    };
    if (editData.status === 'finished') {
      payload.projectLink = editData.projectLink;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/auth/admin/project-requirement/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Project requirement updated successfully!');
      setEditingId(null);
      setEditData({ status: '', projectLink: '', adminNotes: '', estimatedCompletionDate: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update project requirement.');
    }
  };

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(projects.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = projects.slice(start, start + itemsPerPage);

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
              placeholder="Search by reference ID, idea, or preference..."
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
          <>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
            <p className="text-gray-400">
              Showing recent <span className="text-white font-semibold">5</span> per page
            </p>
            <p className="text-gray-400">
              Page <span className="text-white font-semibold">{currentPage}</span> of <span className="text-white font-semibold">{totalPages}</span>
            </p>
          </div>
          <div className="space-y-4">
            {pageItems.map((project) => {
              const statusInfo = statusLabels[project.status] || statusLabels.pending;
              const isEditing = editingId === project._id;
              
              return (
                <div key={project._id} className="bg-gray-700 rounded-xl p-6 border border-gray-600">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      {project.submissionId && (
                        <div className="mb-3">
                          <span className="text-gray-400 text-sm">Reference ID:</span>
                          <span className="ml-2 font-mono font-bold text-yellow-400 text-base tracking-tight">
                            {project.submissionId}
                          </span>
                        </div>
                      )}
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
                        <span className="text-gray-300 ml-2 text-sm">{formatDateOnly(project.createdAt)}</span>
                      </div>
                      {project.estimatedCompletionDate && (
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Estimated completion:</span>
                          <span className="text-amber-300 ml-2 text-sm font-semibold">
                            {formatDateOnly(project.estimatedCompletionDate)}
                          </span>
                        </div>
                      )}
                      {project.finishedAt && (
                        <div className="mb-2">
                          <span className="text-gray-400 text-sm">Delivered:</span>
                          <span className="text-green-300 ml-2 text-sm font-semibold">
                            {formatDateOnly(project.finishedAt)}
                          </span>
                        </div>
                      )}
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

                  {!isEditing && (
                    <div className="mb-4 p-4 bg-gray-800/80 rounded-lg border border-gray-600">
                      <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-3">Status timeline</h4>
                      <div className="space-y-0">
                        {getTimelineEntries(project).map((entry, idx, arr) => (
                          <div key={`${idx}-${entry.at}`} className="flex gap-3">
                            <div className="flex flex-col items-center w-3 shrink-0 pt-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-success-500 shrink-0 z-10" />
                              {idx < arr.length - 1 ? (
                                <span className="w-0.5 flex-1 min-h-[1.75rem] bg-gray-600" aria-hidden />
                              ) : null}
                            </div>
                            <div className={`pb-4 ${idx === arr.length - 1 ? 'pb-0' : ''}`}>
                              <p className="text-sm font-medium text-white">{timelineStepTitle(entry.status, idx)}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{formatDateOnly(entry.at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Estimated completion date <span className="text-amber-400">*</span>
                          </label>
                          <input
                            type="date"
                            value={editData.estimatedCompletionDate}
                            onChange={(e) => setEditData({ ...editData, estimatedCompletionDate: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-success-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Required before moving out of pending. Shown to the user (date only, no time).
                          </p>
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
                            type="button"
                            onClick={() => handleUpdate(project._id, project)}
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
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-2 rounded-lg border text-sm font-semibold ${
                    p === currentPage
                      ? 'bg-success-500 border-success-400 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProjectRequests;

