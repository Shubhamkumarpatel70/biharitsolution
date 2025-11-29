import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useOutletContext, Link } from 'react-router-dom';

const statusLabels = {
  pending: { label: 'Pending', color: 'text-yellow-600 bg-yellow-100', icon: '⏳' },
  under_review: { label: 'Under Review', color: 'text-blue-600 bg-blue-100', icon: '🔍' },
  under_development: { label: 'Under Development', color: 'text-purple-600 bg-purple-100', icon: '🚧' },
  last_stage: { label: 'Last Stage of Development', color: 'text-orange-600 bg-orange-100', icon: '⚡' },
  finished: { label: 'Finished', color: 'text-green-600 bg-green-100', icon: '✅' },
};

const ProjectRequirement = () => {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasSubscription, setHasSubscription] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [formData, setFormData] = useState({
    projectIdea: '',
    websitePreference: '',
    linkOption: '',
  });

  useEffect(() => {
    fetchProjects();
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/user-subscriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const subscriptions = res.data.subscriptions || [];
      // Check if user has any subscription (active, pending, or even expired)
      const hasAnySubscription = subscriptions.length > 0;
      setHasSubscription(hasAnySubscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setHasSubscription(false);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/auth/project-requirements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data.projectRequirements);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Could not fetch project requirements.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/auth/project-requirement', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Project requirement submitted successfully!');
      setFormData({ projectIdea: '', websitePreference: '', linkOption: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit project requirement.');
    } finally {
      setSubmitting(false);
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

  if (loading || checkingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-6">Submit Project Requirement</h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {!hasSubscription ? (
          <div className="bg-gradient-to-r from-accent-500/10 to-primary-500/10 border-2 border-accent-500/30 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl font-bold text-primary-600 mb-3">Subscription Required</h3>
            <p className="text-gray-600 mb-6">
              You need to purchase a subscription plan to submit project requirements.
            </p>
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-accent text-primary-900 font-bold rounded-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
            >
              <span>📦</span>
              <span>Buy a Plan to Continue</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="projectIdea" className="block text-sm font-medium text-gray-700 mb-2">
                Project Idea <span className="text-red-500">*</span>
              </label>
              <textarea
                id="projectIdea"
                value={formData.projectIdea}
                onChange={(e) => setFormData({ ...formData, projectIdea: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all"
                placeholder="Describe your project idea in detail..."
              />
            </div>

            <div>
              <label htmlFor="websitePreference" className="block text-sm font-medium text-gray-700 mb-2">
                Website Preference
              </label>
              <input
                type="text"
                id="websitePreference"
                value={formData.websitePreference}
                onChange={(e) => setFormData({ ...formData, websitePreference: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="e.g., Modern, Minimalist, E-commerce, Portfolio..."
              />
            </div>

            <div>
              <label htmlFor="linkOption" className="block text-sm font-medium text-gray-700 mb-2">
                Link Option / Reference
              </label>
              <input
                type="text"
                id="linkOption"
                value={formData.linkOption}
                onChange={(e) => setFormData({ ...formData, linkOption: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Any reference website or link..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-gradient-accent text-primary-900 font-semibold rounded-lg hover:shadow-xl hover:scale-[1.02] transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? 'Submitting...' : 'Submit Project Requirement'}
            </button>
          </form>
        )}
      </div>

      {/* Existing Projects */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-primary-600 mb-6">My Project Requirements</h2>
        
        {projects.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No project requirements submitted yet.</p>
            <p className="text-sm mt-2">Submit your first project idea above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const statusInfo = statusLabels[project.status] || statusLabels.pending;
              return (
                <div key={project._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color} flex items-center gap-1`}>
                          <span>{statusInfo.icon}</span>
                          <span>{statusInfo.label}</span>
                        </span>
                        <span className="text-sm text-gray-500">
                          Submitted: {formatDate(project.createdAt)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Idea</h3>
                      <p className="text-gray-700 whitespace-pre-wrap mb-4">{project.projectIdea}</p>
                      
                      {project.websitePreference && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-600">Website Preference: </span>
                          <span className="text-gray-700">{project.websitePreference}</span>
                        </div>
                      )}
                      
                      {project.linkOption && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-600">Reference Link: </span>
                          <a 
                            href={project.linkOption} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            {project.linkOption}
                          </a>
                        </div>
                      )}
                      
                      {project.adminNotes && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="text-sm font-medium text-blue-900">Admin Notes: </span>
                          <span className="text-blue-700">{project.adminNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {project.status === 'finished' && project.projectLink && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href={project.projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 hover:shadow-lg hover:scale-105 transform transition-all duration-300"
                      >
                        <span>🌐</span>
                        <span>View Project</span>
                      </a>
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

export default ProjectRequirement;

