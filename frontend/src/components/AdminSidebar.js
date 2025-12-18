import React, { useState, useMemo } from 'react';

export const adminNavItems = [
  { id: 'home', label: 'Dashboard', icon: '🏠', category: 'main' },
  { id: 'approve', label: 'Approve Subs', icon: '✅', category: 'subscriptions' },
  { id: 'approved-plans', label: 'Approved Plans', icon: '📋', category: 'subscriptions' },
  { id: 'cancellations', label: 'Cancellations', icon: '❌', category: 'subscriptions' },
  { id: 'renewal-requests', label: 'Renewal Requests', icon: '🔄', category: 'subscriptions' },
  { id: 'user-plans', label: 'User Plans', icon: '👥', category: 'subscriptions' },
  { id: 'project-requests', label: 'Project Requests', icon: '💼', category: 'projects' },
  { id: 'users', label: 'Manage Users', icon: '🧑‍💼', category: 'management' },
  { id: 'stats', label: 'Site Stats', icon: '📊', category: 'analytics' },
  { id: 'notifications', label: 'Notifications', icon: '🔔', category: 'management' },
  { id: 'plans', label: 'Plans', icon: '📦', category: 'content' },
  { id: 'team', label: 'Team', icon: '👨‍💼', category: 'content' },
  { id: 'features', label: 'Features', icon: '✨', category: 'content' },
  { id: 'services', label: 'Services', icon: '🛠️', category: 'content' },
  { id: 'contacts', label: 'Contacts', icon: '📬', category: 'communication' },
  { id: 'newsletter', label: 'Newsletter Subs', icon: '📧', category: 'communication' },
  { id: 'payment-options', label: 'Payment Options', icon: '💳', category: 'settings' },
  { id: 'coupons', label: 'Coupons', icon: '🏷️', category: 'settings' },
  { id: 'help', label: 'Help', icon: '🆘', category: 'support' },
];

const categoryLabels = {
  main: 'Main',
  subscriptions: 'Subscriptions',
  projects: 'Projects',
  management: 'Management',
  analytics: 'Analytics',
  content: 'Content',
  communication: 'Communication',
  settings: 'Settings',
  support: 'Support'
};

const AdminSidebar = ({ onLogout, activeTab, setActiveTab, onClose, userRole = 'admin' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out "Manage Users" for co-admin
  const baseNavItems = userRole === 'coadmin' 
    ? adminNavItems.filter(item => item.id !== 'users')
    : adminNavItems;

  // Filter nav items based on search
  const filteredNavItems = useMemo(() => {
    if (!searchTerm) return baseNavItems;
    const term = searchTerm.toLowerCase();
    return baseNavItems.filter(item => 
      item.label.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term)
    );
  }, [baseNavItems, searchTerm]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups = {};
    filteredNavItems.forEach(item => {
      const category = item.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
    });
    return groups;
  }, [filteredNavItems]);

  const isCoAdmin = userRole === 'coadmin';

  return (
    <div className="h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center text-3xl font-bold text-gray-900">
            🛡️
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-success-500">
              {isCoAdmin ? 'Co-Admin Panel' : 'Admin Panel'}
            </h2>
            <p className="text-xs text-gray-400">Control Center</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search menu..."
            className="w-full px-4 py-2 pl-10 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-transparent text-sm"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No menu items found
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
                {categoryLabels[category] || category}
              </h3>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl
                    transition-all duration-200 text-left
                    ${activeTab === item.id 
                      ? 'bg-success-500/20 text-success-500 border border-success-500/30 shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={onLogout} 
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-danger-500/20 hover:bg-danger-500/30 text-danger-400 rounded-xl font-medium transition-all duration-200 border border-danger-500/30"
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
