import React from 'react';
import { NavLink } from 'react-router-dom';
export const adminNavItems = [
  { id: 'home', label: 'Dashboard', icon: '🏠' },
  { id: 'approve', label: 'Approve Subs', icon: '✅' },
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

const AdminSidebar = ({ onLogout, activeTab, setActiveTab, isMobile, onLinkClick }) => {
  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-avatar">
          <span role="img" aria-label="admin">🛡️</span>
        </div>
        <h2 className="sidebar-title">Admin Panel</h2>
      </div>
      <nav className="sidebar-nav">
        {adminNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (isMobile && onLinkClick) onLinkClick();
            }}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <button onClick={onLogout} className="logout-btn">
        <span className="nav-icon">🚪</span>
        <span className="nav-label">Logout</span>
      </button>
      <style>{`
        .admin-sidebar {
          width: 250px;
          background: #23272F;
          min-height: 90vh;
          margin: 2vh 1vw;
          border-radius: 1.2rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.13);
          color: #E5E7EB;
          position: sticky;
          top: 20px;
          overflow-y: auto;
          max-height: 96vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          z-index: 1100;
        }
        .sidebar-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }
        .sidebar-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #2ECC71;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: #181A20;
          margin-bottom: 10px;
        }
        .sidebar-title {
          font-weight: 700;
          font-size: 1.3rem;
          color: #2ECC71;
          letter-spacing: 1px;
        }
        .sidebar-nav {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          margin-bottom: auto;
        }
        .nav-item {
          color: #E5E7EB;
          font-weight: 600;
          text-decoration: none;
          padding: 0.7rem 1rem;
          border-radius: 0.7rem;
          background: none;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          transition: background 0.2s, color 0.2s;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .nav-item.active {
          color: #2ECC71;
          background: rgba(46,204,113,0.12);
        }
        .nav-icon {
          font-size: 1.3rem;
        }
        .logout-btn {
          background: #FF6B35;
          color: #fff;
          margin-top: 1rem;
          width: 100%;
          justify-content: center;
          color: #E5E7EB;
          font-weight: 600;
          text-decoration: none;
          padding: 0.7rem 1rem;
          border-radius: 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          transition: background 0.2s, color 0.2s;
          font-size: 1.1rem;
          border: none;
          cursor: pointer;
          text-align: left;
        }
        .logout-btn:hover {
          background: #e65a2e;
        }
        @media (max-width: 1024px) {
          .admin-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSidebar;