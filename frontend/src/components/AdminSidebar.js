import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './icons';

export const adminNavItems = [
  { id: 'home', label: 'Dashboard', iconName: 'home', category: 'main' },
  { id: 'funds', label: 'Funds', iconName: 'currency', category: 'finance' },
  { id: 'refunds', label: 'Refunds', iconName: 'refresh', category: 'finance' },
  { id: 'approve', label: 'Approve Subs', iconName: 'check', category: 'subscriptions' },
  { id: 'approved-plans', label: 'Approved Plans', iconName: 'clipboard', category: 'subscriptions' },
  { id: 'cancellations', label: 'Cancellations', iconName: 'close', category: 'subscriptions' },
  { id: 'renewal-requests', label: 'Renewal Requests', iconName: 'refresh', category: 'subscriptions' },
  { id: 'user-plans', label: 'User Plans', iconName: 'users', category: 'subscriptions' },
  { id: 'project-requests', label: 'Project Requests', iconName: 'document', category: 'projects' },
  { id: 'users', label: 'Manage Users', iconName: 'user', category: 'customers' },
  { id: 'stats', label: 'Site Stats', iconName: 'chart', category: 'reports' },
  { id: 'notifications', label: 'Notifications', iconName: 'bell', category: 'customers' },
  { id: 'id-card', label: 'ID Card', iconName: 'creditCard', category: 'customers' },
  { id: 'agreements', label: 'Agreements', iconName: 'document', category: 'customers' },
  { id: 'plans', label: 'Plans', iconName: 'folder', category: 'website' },
  { id: 'team', label: 'Team', iconName: 'users', category: 'website' },
  { id: 'client-work', label: 'Client Work', iconName: 'briefcase', category: 'website' },
  { id: 'projects-content', label: 'Latest Projects', iconName: 'folder', category: 'website' },
  { id: 'contacts', label: 'Contacts', iconName: 'mail', category: 'communication' },
  { id: 'careers', label: 'Careers', iconName: 'briefcase', category: 'careers' },
  { id: 'career-applications', label: 'Career Applications', iconName: 'document', category: 'careers' },
  { id: 'promotional-email', label: 'Promotional Email', iconName: 'mail', category: 'communication' },
  { id: 'promotional-unsubscribed', label: 'Promotional Unsubscribed', iconName: 'close', category: 'communication' },
  { id: 'newsletter', label: 'Newsletter Subs', iconName: 'clipboard', category: 'communication' },
  { id: 'payment-options', label: 'Payment Options', iconName: 'creditCard', category: 'finance' },
  { id: 'coupons', label: 'Coupons', iconName: 'currency', category: 'finance' },
  { id: 'help', label: 'Help', iconName: 'help', category: 'support' },
  { id: 'privacy-requests', label: 'Privacy Requests', iconName: 'shield', category: 'settings' },
  { id: 'privacy-compliance', label: 'Monthly Compliance', iconName: 'clipboard', category: 'settings' },
  { id: 'privacy-register', label: 'Privacy Registers', iconName: 'shield', category: 'settings' },
  { id: 'privacy-operations', label: 'Privacy Operations', iconName: 'clipboard', category: 'settings' },
];

const categoryLabels = {
  main: 'Overview',
  finance: 'Finance & Billing',
  subscriptions: 'Subscriptions',
  projects: 'Project Requests',
  customers: 'Customers & Accounts',
  reports: 'Reports & Analytics',
  website: 'Website Content',
  communication: 'Communication',
  careers: 'Careers & Hiring',
  settings: 'Settings',
  support: 'Help & Support'
};

const AdminSidebar = ({ onLogout, activeTab, setActiveTab, onClose, userRole = 'admin' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const activeCategory = adminNavItems.find(item => item.id === activeTab)?.category || 'main';
  const [expandedCategories, setExpandedCategories] = useState(() => new Set(['main', activeCategory]));

  useEffect(() => {
    setExpandedCategories(current => new Set([...current, activeCategory]));
  }, [activeCategory]);

  const toggleCategory = (category) => {
    setExpandedCategories(current => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const baseNavItems = userRole === 'coadmin'
    ? adminNavItems.filter(item => !['users', 'refunds'].includes(item.id))
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
  const totalSections = Object.keys(groupedItems).length;

  return (
    <div className="h-full min-h-0 w-[18rem] max-w-[100vw] bg-white border-r border-slate-200 flex flex-col shadow-xl shadow-slate-900/5 overflow-hidden">
      <div className="shrink-0 p-4 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
            <Icon name="shield" className="w-6 h-6 text-slate-700" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 leading-tight">Control Console</h2>
            <p className="text-xs text-slate-500">{isCoAdmin ? 'Co-Admin workspace' : 'Admin workspace'}</p>
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
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[11px] font-medium text-slate-500">
            {isCoAdmin ? 'Co-Admin workspace' : 'Admin workspace'}
          </span>
          <span className="text-[10px] font-semibold text-emerald-700">● Online</span>
        </div>
      </div>

      <div className="shrink-0 p-2.5 border-b border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search menu…"
            className="w-full px-3 py-2.5 pl-9 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-sm"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon name="search" className="w-4 h-4" />
          </span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded"
              aria-label="Clear search"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No menu items found</div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => {
            const expanded = Boolean(searchTerm) || expandedCategories.has(category);
            const containsActive = items.some(item => item.id === activeTab);
            return (
              <div key={category} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={expanded}
                  className={"w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left hover:bg-slate-100 transition-colors " + (containsActive ? "text-sky-800" : "text-slate-500")}
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.13em]">
                    {categoryLabels[category] || category}
                    <span className="ml-2 font-medium text-slate-400">{items.length}</span>
                  </span>
                  <Icon name={expanded ? "chevronDown" : "chevronRight"} className="w-4 h-4 shrink-0 text-slate-400" />
                </button>
                {expanded && (
                  <div className="mt-1 space-y-0.5">
                    {items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          if (onClose) onClose();
                        }}
                        className={"group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors min-w-0 " + (activeTab === item.id ? "bg-sky-50 text-sky-800 font-semibold ring-1 ring-inset ring-sky-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}
                      >
                        <span className={"shrink-0 " + (activeTab === item.id ? "text-sky-700" : "text-slate-400 group-hover:text-slate-700")}>
                          <Icon name={item.iconName} className="w-[18px] h-[18px]" strokeWidth={activeTab === item.id ? 2.25 : 1.75} />
                        </span>
                        <span className="font-medium text-[13px] leading-snug">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      <div className="shrink-0 p-3 border-t border-slate-200 bg-white">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl font-semibold transition-colors border border-slate-200 hover:border-red-200"
        >
          <Icon name="logout" className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
