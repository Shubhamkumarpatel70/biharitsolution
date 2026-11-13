import React, { useState, useEffect } from 'react';
import axios from '../axios';

const AdminTeam = () => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [founderImage, setFounderImage] = useState(null);
  const [founderPreview, setFounderPreview] = useState('');
  const [founderLoading, setFounderLoading] = useState(false);
  const [founderSaving, setFounderSaving] = useState(false);
  const [imageMigrationRunning, setImageMigrationRunning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '', 
    email: '',
    phone: '',
    bio: '',
    order: 0,
    socialLinks: {
      linkedin: '',
      twitter: '',
      github: '',
      instagram: ''
    },
    profileImage: null
  });

  useEffect(() => {
    fetchTeamMembers();
    fetchFounderProfile();
  }, []);

  const fetchFounderProfile = async () => {
    try {
      setFounderLoading(true);
      const response = await axios.get('/api/auth/founder-profile');
      setFounderPreview(response.data.profile?.image || '');
    } catch (err) {
      setFounderPreview('');
    } finally { setFounderLoading(false); }
  };

  const saveFounderImage = async (e) => {
    e.preventDefault();
    if (!founderImage) { setError('Please choose a founder image first.'); return; }
    try {
      setFounderSaving(true); setError('');
      const data = new FormData(); data.append('founderImage', founderImage);
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/auth/admin/founder-profile', data, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      setFounderPreview(response.data.profile?.image || ''); setFounderImage(null);
      setSuccess('Founder image updated. The About page now uses this image.');
    } catch (err) { setError(err.response?.data?.message || 'Could not upload founder image.'); }
    finally { setFounderSaving(false); }
  };

  const migrateLegacyImages = async () => {
    const confirmed = window.confirm('Migrate existing Base64 images from MongoDB to Cloudinary? This may take a few minutes.');
    if (!confirmed) return;
    try {
      setImageMigrationRunning(true); setError(''); setSuccess('');
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/auth/admin/cloudinary/migrate-images', {}, { headers: { Authorization: `Bearer ${token}` } });
      const summary = response.data.summary || {};
      const moved = Object.entries(summary).filter(([key]) => key !== 'failed').reduce((total, [, value]) => total + Number(value || 0), 0);
      setSuccess(`Cloudinary migration completed: ${moved} image(s) moved. ${(summary.failed || []).length} failed.`);
      if (summary.failed?.length) setError(summary.failed.map(item => `${item.type} (${item.id}): ${item.message}`).join(' | '));
      await fetchFounderProfile();
      await fetchTeamMembers();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not migrate existing images to Cloudinary.');
    } finally { setImageMigrationRunning(false); }
  };

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/admin/team', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sort team members by order
      const sortedMembers = (response.data.teamMembers || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setTeamMembers(sortedMembers);
    } catch (err) {
      setError('Failed to fetch team members');
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const socialPlatform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialPlatform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      email: '',
      phone: '',
      bio: '',
      order: 0,
      socialLinks: {
        linkedin: '',
        twitter: '',
        github: '',
        instagram: ''
      },
      profileImage: null
    });
    setEditingMember(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Add all form fields to FormData
      Object.keys(formData).forEach(key => {
        if (key === 'socialLinks') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (key === 'profileImage' && formData[key]) {
          formDataToSend.append('profileImage', formData[key]);
        } else if (key !== 'profileImage') {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (editingMember) {
        await axios.put(`/api/auth/admin/team/${editingMember._id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/auth/admin/team', formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      fetchTeamMembers();
      resetForm();
      setError(''); // Clear any previous errors
      setSuccess(editingMember ? 'Team member updated successfully!' : 'Team member added successfully!');
      setTimeout(() => setSuccess(''), 3000); // Clear success message after 3 seconds
    } catch (err) {
      console.error('Error saving team member:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid data provided.');
      } else {
        setError(err.response?.data?.message || 'Failed to save team member. Please try again.');
      }
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      position: member.position || '',
      email: member.email || '',
      phone: member.phone || '',
      bio: member.bio || '',
      order: member.order || 0,
      socialLinks: member.socialLinks || {
        linkedin: '',
        twitter: '',
        github: '',
        instagram: ''
      },
      profileImage: null
    });
    setShowAddForm(true);
  };

  const handleDelete = async (memberId) => {
    const member = teamMembers.find(m => m._id === memberId);
    const memberName = member ? member.name : 'this team member';
    
    if (!window.confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/auth/admin/team/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTeamMembers();
      setSuccess('Team member deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting team member:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to delete team members.');
      } else if (err.response?.status === 404) {
        setError('Team member not found.');
      } else {
        setError('Failed to delete team member. Please try again.');
      }
    }
  };

  if (loading) {
    return (
    <div className="admin-team-page flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-slate-700 text-xl font-semibold">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="admin-team-page min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700">Team Management</h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">Manage your team members, their profiles, and social links</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            + Add Team Member
          </button>
        </div>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Founder Profile Image</h2>
            <p className="mt-1 text-sm text-slate-600">Upload or replace the photo shown in the public About page. JPG, PNG or WebP up to 5 MB.</p>
          </div>
          <form onSubmit={saveFounderImage} className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {founderPreview ? <img src={founderPreview} alt="Current founder" className="h-full w-full object-cover" /> : <span className="text-xs text-slate-500">No image</span>}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setFounderImage(e.target.files?.[0] || null)} className="block w-full rounded-xl border border-slate-300 p-2 text-sm" />
              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" disabled={!founderImage || founderSaving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{founderSaving ? 'Uploading…' : 'Upload founder image'}</button>
                <span className="text-xs text-slate-500">{founderLoading ? 'Loading current image…' : founderImage ? founderImage.name : founderPreview ? 'Current image is active' : 'No founder image uploaded'}</span>
              </div>
            </div>
          </form>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            <strong>Storage:</strong> The image is uploaded securely to Cloudinary. MongoDB stores only the Cloudinary secure URL; the image remains available after redeploys.
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cloudinary Image Migration</h2>
              <p className="mt-1 text-sm text-slate-600">Move older Base64 images already stored in MongoDB to Cloudinary. New uploads are stored on Cloudinary automatically.</p>
            </div>
            <button type="button" onClick={migrateLegacyImages} disabled={imageMigrationRunning} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50">
              {imageMigrationRunning ? 'Migrating images…' : 'Migrate existing images'}
            </button>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-white hover:text-slate-700"
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
              className="float-right text-white hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 sm:p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-6 text-emerald-700">
              {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Position *</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tell us about this team member..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-emerald-700">Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">LinkedIn</label>
                    <input
                      type="url"
                      name="social.linkedin"
                      value={formData.socialLinks.linkedin}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter</label>
                    <input
                      type="url"
                      name="social.twitter"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub</label>
                    <input
                      type="url"
                      name="social.github"
                      value={formData.socialLinks.github}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Instagram</label>
                    <input
                      type="url"
                      name="social.instagram"
                      value={formData.socialLinks.instagram}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  {editingMember ? 'Update Member' : 'Add Member'}
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

        {/* Team Members Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teamMembers.map((member) => (
            <div key={member._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-600 flex items-center justify-center text-lg sm:text-2xl font-bold overflow-hidden">
                    {member.profileImage ? (
                      <img
                        src={member.profileImage}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{member.name}</h3>
                    <p className="text-emerald-700 text-sm sm:text-base truncate">{member.position}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">Order: {member.order || 0}</p>
                  </div>
                </div>
                <div className="flex space-x-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleEdit(member)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors text-sm"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors text-sm"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {member.bio && (
                <p className="text-slate-600 text-sm mb-4">{member.bio}</p>
              )}

              <div className="space-y-2 mb-4">
                {member.email && (
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">📧</span>
                    <a href={`mailto:${member.email}`} className="hover:text-emerald-700">
                      {member.email}
                    </a>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">📞</span>
                    <a href={`tel:${member.phone}`} className="hover:text-emerald-700">
                      {member.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {member.socialLinks && Object.values(member.socialLinks).some(link => link) && (
                <div className="flex space-x-3">
                  {member.socialLinks.linkedin && (
                    <a
                      href={member.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xl"
                      title="LinkedIn"
                    >
                      💼
                    </a>
                  )}
                  {member.socialLinks.twitter && (
                    <a
                      href={member.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xl"
                      title="Twitter"
                    >
                      🐦
                    </a>
                  )}
                  {member.socialLinks.github && (
                    <a
                      href={member.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-600 text-xl"
                      title="GitHub"
                    >
                      📚
                    </a>
                  )}
                  {member.socialLinks.instagram && (
                    <a
                      href={member.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 text-xl"
                      title="Instagram"
                    >
                      📷
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {teamMembers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Team Members Yet</h3>
            <p className="text-gray-500">Add your first team member to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeam;
