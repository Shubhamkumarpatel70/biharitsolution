import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/dashboard/project-requirement', label: 'Project Requirement', icon: '💼' },
  { to: '/dashboard/support', label: 'Help & Support', icon: '💬' },
  { to: '/dashboard/subscription', label: 'Subscription', icon: '📦' },
  { to: '/dashboard/purchases', label: 'My Purchases', icon: '🛒' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
];

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/dashboard/project-requirement', label: 'Project', icon: '💼' },
  { to: '/dashboard/support', label: 'Help', icon: '💬' },
  { to: '/dashboard/subscription', label: 'Subscription', icon: '📦' },
  { to: '/dashboard/purchases', label: 'Purchase', icon: '🛒' },
];

const MobileBottomNav = ({ user, onLogout }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!user || !mounted) return null;
  return createPortal(
    (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => `
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors duration-200
                ${isActive ? 'text-accent-500 bg-accent-500/5' : 'text-text-muted hover:text-primary-600'}
              `}
              tabIndex={0}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
          <button 
            onClick={onLogout} 
            className="flex flex-col items-center justify-center flex-1 h-full text-text-muted hover:text-danger-500 transition-colors duration-200"
            tabIndex={0}
          >
            <span className="text-xl mb-1">🚪</span>
            <span className="text-xs font-medium">Logout</span>
          </button>
        </div>
      </nav>
    ),
    document.body
  );
};

const Sidebar = ({ onLogout, isPlanExpired, user, onClose }) => (
  <>
    <div className="h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-accent rounded-xl flex items-center justify-center text-2xl">
            {user?.name ? user.name.split(' ').map(n => n[0]).join('') : '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-primary-600 truncate">User Panel</h2>
            <p className="text-sm text-text-muted truncate">Welcome back!</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-light transition-colors"
            aria-label="Close sidebar"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 mb-2 rounded-xl
              transition-all duration-200
              ${isActive 
                ? 'bg-gradient-accent text-primary-900 shadow-md' 
                : 'text-text-main hover:bg-gray-light hover:text-primary-600'
              }
            `}
            tabIndex={0}
            onClick={onClose}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
        {isPlanExpired && (
          <NavLink
            to="/dashboard/expired"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 mb-2 rounded-xl
              transition-all duration-200
              ${isActive 
                ? 'bg-warning-500/20 text-warning-600 border border-warning-500/30' 
                : 'text-text-main hover:bg-warning-500/10 hover:text-warning-600'
              }
            `}
            tabIndex={0}
            onClick={onClose}
          >
            <span className="text-xl">⏰</span>
            <span className="font-medium">Plan Expired</span>
          </NavLink>
        )}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onLogout} 
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-danger-500/10 hover:bg-danger-500/20 text-danger-600 rounded-xl font-medium transition-all duration-200"
          tabIndex={0}
        >
          <span className="text-xl">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>

    {/* Mobile Bottom Nav */}
    <MobileBottomNav user={user} onLogout={onLogout} />
  </>
); 

export default Sidebar;
