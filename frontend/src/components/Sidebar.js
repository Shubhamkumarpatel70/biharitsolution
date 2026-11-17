import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Icon } from './icons';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', iconName: 'home', end: true },
  { to: '/dashboard/project-requirement', label: 'Project', iconName: 'briefcase', end: false },
  { to: '/dashboard/support', label: 'Help', iconName: 'chat', end: false },
  { to: '/dashboard/subscription', label: 'Subscription', iconName: 'creditCard', end: false },
  { to: '/dashboard/refunds', label: 'My Refunds', iconName: 'refresh', end: false },
  { to: '/dashboard/agreements', label: 'Agreements', iconName: 'document', end: false },
  { to: '/dashboard/purchases', label: 'Purchases', iconName: 'cart', end: false },
  { to: '/dashboard/notifications', label: 'Notifications', iconName: 'bell', end: false },
  { to: '/dashboard/privacy', label: 'Privacy Centre', iconName: 'shield', end: false },
  { to: '/dashboard/settings', label: 'Settings & Security', iconName: 'settings', end: false },
];

const mobileNavItems = [
  { to: '/dashboard', label: 'Home', iconName: 'home', end: true },
  { to: '/dashboard/project-requirement', label: 'Project', iconName: 'briefcase', end: false },
  { to: '/dashboard/agreements', label: 'Agreements', iconName: 'document', end: false },
  { to: '/dashboard/subscription', label: 'Plan', iconName: 'creditCard', end: false },
  { to: '/dashboard/refunds', label: 'Refunds', iconName: 'refresh', end: false },
  { to: '/dashboard/notifications', label: 'Alerts', iconName: 'bell', end: false },
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
    <div className="h-full min-h-0 w-full max-w-[100vw] bg-white border-r border-slate-200 flex flex-col shadow-xl overflow-hidden">
      <div className="shrink-0 px-4 py-4 border-b border-slate-200 bg-sky-50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-white text-[11px] font-black tracking-tight text-sky-800 shadow-sm">ASKC</div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-xs font-extrabold uppercase tracking-wider text-slate-900">ASKC Technologies</h2>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-500">{user?.name || 'Member workspace'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-sky-100 text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="Close sidebar"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 py-4 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 min-w-0 border border-transparent ${
                isActive
                  ? 'bg-sky-50 text-sky-900 shadow-sm font-bold ring-1 ring-sky-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-sky-800'
              }`
            }
            tabIndex={0}
            onClick={onClose}
          >
            {({ isActive }) => (
              <>
                <Icon
                  name={item.iconName}
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-700' : 'text-slate-400 group-hover:text-sky-700'}`}
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

      <div className="shrink-0 p-3 border-t border-slate-200 mt-auto bg-slate-50">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-[13px] font-semibold transition-all duration-200 border border-slate-200 hover:border-red-200"
          tabIndex={0}
        >
          <Icon name="logout" className="w-4 h-4" strokeWidth={2} />
          <span>Log out</span>
        </button>
      </div>
    </div>


  </>
);

export default Sidebar;
