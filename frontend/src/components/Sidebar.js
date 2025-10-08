import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { createPortal } from 'react-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/dashboard/support', label: 'Help & Support', icon: '💬' },
  { to: '/dashboard/subscription', label: 'Subscription', icon: '📦' },
  { to: '/dashboard/purchases', label: 'My Purchases', icon: '🛒' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
];

// Mobile bottom nav: exactly 5 items as requested
const mobileNavItems = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/dashboard/support', label: 'Help', icon: '💬' },
  { to: '/dashboard/subscription', label: 'Subscription', icon: '📦' },
  { to: '/dashboard/purchases', label: 'Purchase', icon: '🛒' },
  // Fifth item will be Logout button (🚪)
];

// Render bottom nav at document.body level to avoid being affected by parent transforms/overflow
const MobileBottomNav = ({ user, onLogout }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!user || !mounted) return null;
  return createPortal(
    (
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
            tabIndex={0}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
        <button className="bottom-nav-item logout" onClick={onLogout} tabIndex={0}>
          <span className="bottom-nav-icon">🚪</span>
          <span className="bottom-nav-label">Logout</span>
        </button>
      </nav>
    ),
    document.body
  );
};

const Sidebar = ({ onLogout, isPlanExpired, user }) => (
  <>
    <div className="modern-sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="user-avatar">
          <span>👤</span>
        </div>
        <div className="sidebar-title">
          <h2>User Panel</h2>
          <p>Welcome back!</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            tabIndex={0}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <span className="nav-indicator"></span>
          </NavLink>
        ))}
        {isPlanExpired && (
          <NavLink
            to="/dashboard/expired"
            className={({ isActive }) => `nav-item expired${isActive ? ' active' : ''}`}
            tabIndex={0}
          >
            <span className="nav-icon">⏰</span>
            <span className="nav-label">Plan Expired</span>
            <span className="nav-indicator"></span>
          </NavLink>
        )}
      </nav>

      {/* Logout Button */}
      <button onClick={onLogout} className="logout-btn" tabIndex={0}>
        <span className="logout-icon">🚪</span>
        <span>Logout</span>
      </button>
    </div>

    {/* Mobile Bottom Nav - only when logged in */}
    <MobileBottomNav user={user} onLogout={onLogout} />
  </>
); 

export default Sidebar;