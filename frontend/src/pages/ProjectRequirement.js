import React, { useState, useEffect } from 'react';
import axios from '../axios';
import { useOutletContext, Link } from 'react-router-dom';
import { Icon } from '../components/icons';

const statusLabels = {
  pending: { label: 'Pending', color: 'text-yellow-800 bg-yellow-100 border-yellow-200/80', iconName: 'clock' },
  under_review: { label: 'Under Review', color: 'text-blue-800 bg-blue-100 border-blue-200/80', iconName: 'search' },
  under_development: { label: 'Under Development', color: 'text-purple-800 bg-purple-100 border-purple-200/80', iconName: 'wrench' },
  last_stage: { label: 'Last stage', color: 'text-orange-800 bg-orange-100 border-orange-200/80', iconName: 'bolt' },
  finished: { label: 'Finished', color: 'text-green-800 bg-green-100 border-green-200/80', iconName: 'check' },
};

const ProjectRequirement = () => {
  const { user } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
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
      
      // Check if user has an ACTIVE subscription
      // Must be: status='active', not cancelled, not expired, not canceled flag
      const activeSubscription = subscriptions.find(sub => {
        const isActiveStatus = sub.status === 'active';
        const isNotCancelled = sub.cancellationStatus !== 'approved' && !sub.canceled;
        const isNotExpired = !sub.expiresAt || new Date(sub.expiresAt) > new Date();
        const isNotPendingCancellation = sub.cancellationStatus !== 'pending';
        
        return isActiveStatus && isNotCancelled && isNotExpired && isNotPendingCancellation;
      });
      
      const hasActive = !!activeSubscription;
      setHasActiveSubscription(hasActive);
      
      // Store subscription status for messaging
      if (subscriptions.length > 0) {
        const latestSub = subscriptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const now = new Date();
        const isExpired = latestSub.expiresAt && new Date(latestSub.expiresAt) < now;
        const isCancelled = latestSub.cancellationStatus === 'approved' || latestSub.canceled;
        const isInactive = latestSub.status !== 'active' || isExpired || isCancelled;
        
        setSubscriptionStatus({
          status: latestSub.status,
          cancellationStatus: latestSub.cancellationStatus,
          isExpired: isExpired,
          isCancelled: isCancelled,
          isInactive: isInactive,
          canceled: latestSub.canceled
        });
      } else {
        setSubscriptionStatus(null);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setHasActiveSubscription(false);
      setSubscriptionStatus(null);
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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 w-full min-w-0 px-1 sm:px-0">
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-4 sm:mb-6 break-words leading-tight">
          Submit project requirement
        </h2>

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

        {!hasActiveSubscription ? (
          <div className="bg-gradient-to-r from-amber-50 to-slate-100 border-2 border-amber-200/80 rounded-xl p-5 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100 border border-amber-200 text-amber-900 mb-4 mx-auto">
              <Icon name="lock" className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2} />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 mb-3 break-words px-1">
              Active subscription required
            </h3>
            {subscriptionStatus ? (
              <>
                {subscriptionStatus.isCancelled ? (
                  <>
                    <p className="text-gray-700 mb-2 font-semibold flex flex-wrap items-start justify-center gap-2 text-left sm:text-center max-w-full">
                      <Icon name="close" className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
                      <span className="min-w-0">Your subscription has been cancelled and is inactive.</span>
                    </p>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                      You need an active subscription to submit project requirements.
                    </p>
                  </>
                ) : subscriptionStatus.isExpired ? (
                  <>
                    <p className="text-gray-700 mb-2 font-semibold flex flex-wrap items-start justify-center gap-2 text-left sm:text-center">
                      <Icon name="clock" className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                      <span className="min-w-0">Your subscription has expired.</span>
                    </p>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                      You need an active subscription to submit project requirements.
                    </p>
                  </>
                ) : subscriptionStatus.status === 'pending' ? (
                  <>
                    <p className="text-gray-700 mb-2 font-semibold flex flex-wrap items-start justify-center gap-2 text-left sm:text-center">
                      <Icon name="clock" className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                      <span className="min-w-0">Your subscription is pending approval.</span>
                    </p>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                      Please wait for admin approval before submitting project requirements.
                    </p>
                  </>
                ) : subscriptionStatus.status === 'rejected' ? (
                  <>
                    <p className="text-gray-700 mb-2 font-semibold flex flex-wrap items-start justify-center gap-2 text-left sm:text-center">
                      <Icon name="close" className="w-5 h-5 text-red-600 shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden />
                      <span className="min-w-0">Your subscription was rejected.</span>
                    </p>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                      You need an active subscription to submit project requirements.
                    </p>
                  </>
                ) : subscriptionStatus.isInactive ? (
                  <>
                    <p className="text-gray-700 mb-2 font-semibold flex flex-wrap items-start justify-center gap-2 text-left sm:text-center">
                      <Icon name="warning" className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                      <span className="min-w-0">Your subscription is inactive.</span>
                    </p>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                      You need an active subscription to submit project requirements.
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                    You need an active subscription to submit project requirements.
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed px-1">
                You need to purchase an active subscription plan to submit project requirements.
              </p>
            )}
            <Link
              to="/plans"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-accent text-gray-900 font-bold rounded-xl hover:shadow-lg active:scale-[0.99] transition-all duration-200 w-full sm:w-auto max-w-md mx-auto"
            >
              <Icon name="clipboard" className="w-5 h-5 shrink-0" strokeWidth={2} />
              <span className="text-center leading-snug">View plans to continue</span>
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
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-slate-100">
        <h2 className="text-xl sm:text-2xl font-bold text-primary-800 mb-4 sm:mb-6 break-words leading-tight">
          My project requirements
        </h2>
        
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
                        <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border ${statusInfo.color} inline-flex items-center gap-1.5 max-w-full`}>
                          <Icon name={statusInfo.iconName} className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.25} />
                          <span className="truncate">{statusInfo.label}</span>
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
                        <Icon name="globe" className="w-5 h-5" strokeWidth={2} />
                        <span>View project</span>
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

