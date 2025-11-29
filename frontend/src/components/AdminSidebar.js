import React from 'react';

export const adminNavItems = [
  { id: 'home', label: 'Dashboard', icon: '🏠' },
  { id: 'approve', label: 'Approve Subs', icon: '✅' },
  { id: 'approved-plans', label: 'Approved Plans', icon: '📋' },
  { id: 'cancellations', label: 'Cancellations', icon: '❌' },
  { id: 'project-requests', label: 'Project Requests', icon: '💼' },
  { id: 'user-plans', label: 'User Plans', icon: '👥' },
  { id: 'users', label: 'Manage Users', icon: '🧑‍💼' },
  { id: 'stats', label: 'Site Stats', icon: '📊' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'plans', label: 'Plans', icon: '📦' },
  { id: 'contacts', label: 'Contacts', icon: '📬' },
  { id: 'newsletter', label: 'Newsletter Subs', icon: '📧' },
  { id: 'renewal-requests', label: 'Renewal Requests', icon: '🔄' },
  { id: 'team', label: 'Team', icon: '👨‍💼' },
  { id: 'features', label: 'Features', icon: '✨' },
  { id: 'services', label: 'Services', icon: '🛠️' },
  { id: 'payment-options', label: 'Payment Options', icon: '💳' },
  { id: 'help', label: 'Help', icon: '🆘' },
  { id: 'coupons', label: 'Coupons', icon: '🏷️' },
];

const AdminSidebar = ({ onLogout, activeTab, setActiveTab, onClose }) => {
  return (
    <div className="h-full w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center text-3xl font-bold text-gray-900">
            🛡️
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-success-500">Admin Panel</h2>
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {adminNavItems.map(item => (
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
                ? 'bg-success-500/20 text-success-500 border border-success-500/30' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
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
