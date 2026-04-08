import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Icon } from './icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', iconName: 'home', end: true },
  { to: '/dashboard/project-requirement', label: 'Project', iconName: 'briefcase', end: false },
  { to: '/dashboard/support', label: 'Help', iconName: 'chat', end: false },
  { to: '/dashboard/subscription', label: 'Subscription', iconName: 'creditCard', end: false },
  { to: '/dashboard/purchases', label: 'Purchases', iconName: 'cart', end: false },
  { to: '/dashboard/notifications', label: 'Notifications', iconName: 'bell', end: false },
];

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', iconName: 'home', end: true },
  { to: '/dashboard/project-requirement', label: 'Project', iconName: 'briefcase', end: false },
  { to: '/dashboard/support', label: 'Help', iconName: 'chat', end: false },
  { to: '/dashboard/subscription', label: 'Plan', iconName: 'creditCard', end: false },
  { to: '/dashboard/purchases', label: 'Shop', iconName: 'cart', end: false },
];

const MobileBottomNav = ({ user, onLogout }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!user || !mounted) return null;
  return createPortal(
    (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200 ${
                  isActive ? 'text-primary-600 bg-slate-50' : 'text-slate-500 hover:text-primary-600'
                }`
              }
              tabIndex={0}
            >
              <Icon name={item.iconName} className="w-5 h-5 mb-0.5" strokeWidth={2} />
              <span className="text-[10px] font-medium leading-tight text-center px-0.5">{item.label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={onLogout}
            className="flex flex-col items-center justify-center flex-1 h-full text-slate-500 hover:text-danger-500 transition-colors duration-200"
            tabIndex={0}
          >
            <Icon name="logout" className="w-5 h-5 mb-0.5" strokeWidth={2} />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>
    ),
    document.body
  );
};

const Sidebar = ({ onLogout, isPlanExpired, user, onClose }) => (
  <>
    <div className="h-full min-h-0 w-[15.5rem] max-w-[100vw] bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl overflow-hidden">
      <div className="shrink-0 px-3 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-accent-500 flex items-center justify-center text-xs font-bold text-slate-900 shadow-md shrink-0">
            {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-bold text-slate-100 leading-tight truncate uppercase tracking-wide">Workspace</h2>
            <p className="text-[11px] text-slate-400 truncate leading-tight">{user?.name || 'Member'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain lg:flex-none lg:overflow-y-visible px-2 py-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 min-w-0 ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm font-semibold ring-1 ring-white/15'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
            tabIndex={0}
            onClick={onClose}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.iconName}
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'}`}
                  strokeWidth={2}
                />
                <span className="font-medium text-[13px] leading-tight break-words min-w-0">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        {isPlanExpired && (
          <NavLink
            to="/dashboard/expired"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-warning-500/25 text-amber-100 border border-warning-500/40'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-amber-200'
              }`
            }
            tabIndex={0}
            onClick={onClose}
          >
            <Icon name="clock" className="w-4 h-4 shrink-0" strokeWidth={2} />
            <span className="font-medium text-[13px] leading-tight">Plan expired</span>
          </NavLink>
        )}
      </nav>

      <div className="shrink-0 p-2 border-t border-slate-800 mt-auto">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 bg-slate-800 hover:bg-red-950/50 text-slate-200 hover:text-red-300 rounded-lg text-[13px] font-medium transition-all duration-200 border border-slate-700 hover:border-red-900/50"
          tabIndex={0}
        >
          <Icon name="logout" className="w-4 h-4" strokeWidth={2} />
          <span>Log out</span>
        </button>
      </div>
    </div>

    <MobileBottomNav user={user} onLogout={onLogout} />
  </>
);

export default Sidebar;
