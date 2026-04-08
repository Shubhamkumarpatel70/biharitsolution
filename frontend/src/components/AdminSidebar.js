import React, { useState, useMemo } from 'react';
import { Icon } from './icons';

export const adminNavItems = [
  { id: 'home', label: 'Dashboard', iconName: 'home', category: 'main' },
  { id: 'approve', label: 'Approve Subs', iconName: 'check', category: 'subscriptions' },
  { id: 'approved-plans', label: 'Approved Plans', iconName: 'clipboard', category: 'subscriptions' },
  { id: 'cancellations', label: 'Cancellations', iconName: 'close', category: 'subscriptions' },
  { id: 'renewal-requests', label: 'Renewal Requests', iconName: 'refresh', category: 'subscriptions' },
  { id: 'user-plans', label: 'User Plans', iconName: 'users', category: 'subscriptions' },
  { id: 'project-requests', label: 'Project Requests', iconName: 'document', category: 'projects' },
  { id: 'users', label: 'Manage Users', iconName: 'user', category: 'management' },
  { id: 'stats', label: 'Site Stats', iconName: 'chart', category: 'analytics' },
  { id: 'notifications', label: 'Notifications', iconName: 'bell', category: 'management' },
  { id: 'plans', label: 'Plans', iconName: 'folder', category: 'content' },
  { id: 'team', label: 'Team', iconName: 'users', category: 'content' },
  { id: 'features', label: 'Features', iconName: 'sparkles', category: 'content' },
  { id: 'services', label: 'Services', iconName: 'wrench', category: 'content' },
  { id: 'contacts', label: 'Contacts', iconName: 'mail', category: 'communication' },
  { id: 'careers', label: 'Careers', iconName: 'briefcase', category: 'careers' },
  { id: 'career-applications', label: 'Career Applications', iconName: 'document', category: 'careers' },
  { id: 'newsletter', label: 'Newsletter Subs', iconName: 'clipboard', category: 'communication' },
  { id: 'payment-options', label: 'Payment Options', iconName: 'creditCard', category: 'settings' },
  { id: 'coupons', label: 'Coupons', iconName: 'currency', category: 'settings' },
  { id: 'help', label: 'Help', iconName: 'help', category: 'support' },
];

const categoryLabels = {
  main: 'Main',
  subscriptions: 'Subscriptions',
  projects: 'Projects',
  management: 'Management',
  analytics: 'Analytics',
  content: 'Content',
  communication: 'Communication',
  careers: 'Careers',
  settings: 'Settings',
  support: 'Support'
};

const AdminSidebar = ({ onLogout, activeTab, setActiveTab, onClose, userRole = 'admin' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const baseNavItems = userRole === 'coadmin'
    ? adminNavItems.filter(item => item.id !== 'users')
    : adminNavItems;

  const filteredNavItems = useMemo(() => {
    if (!searchTerm) return baseNavItems;
    const term = searchTerm.toLowerCase();
    return baseNavItems.filter(item =>
      item.label.toLowerCase().includes(term) ||
      item.id.toLowerCase().includes(term)
    );
  }, [baseNavItems, searchTerm]);

  const groupedItems = useMemo(() => {
    const groups = {};
    filteredNavItems.forEach(item => {
      const category = item.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [filteredNavItems]);

  const isCoAdmin = userRole === 'coadmin';

  return (
    <div className="h-full min-h-0 w-64 max-w-[100vw] bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl overflow-hidden">
      <div className="shrink-0 p-5 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg">
            <Icon name="shield" className="w-6 h-6 text-slate-900" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white leading-tight">
              {isCoAdmin ? 'Co-Admin' : 'Admin'}
            </h2>
            <p className="text-xs text-slate-400">Control center</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="shrink-0 p-3 border-b border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search menu…"
            className="w-full px-3 py-2 pl-9 bg-slate-800/80 text-slate-200 placeholder-slate-500 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/60 focus:border-accent-500 text-sm"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Icon name="search" className="w-4 h-4" />
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 rounded"
              aria-label="Clear search"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">No menu items found</div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="mb-5">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
                {categoryLabels[category] || category}
              </h3>
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onClose) onClose();
                  }}
                  className={`
                    group w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-left transition-all duration-150 min-w-0
                    ${activeTab === item.id
                      ? 'bg-white text-slate-900 font-semibold shadow-md ring-1 ring-white/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <span
                    className={`shrink-0 ${
                      activeTab === item.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon name={item.iconName} className="w-5 h-5" strokeWidth={activeTab === item.id ? 2.25 : 1.75} />
                  </span>
                  <span className="font-medium text-sm leading-snug break-words">{item.label}</span>
                </button>
              ))}
            </div>
          ))
        )}
      </nav>

      <div className="shrink-0 p-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 rounded-lg font-medium transition-colors border border-red-500/25"
        >
          <Icon name="logout" className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
