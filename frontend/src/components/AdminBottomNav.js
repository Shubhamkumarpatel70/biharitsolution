import React from 'react';
import { useNavigate } from 'react-router-dom';
import { adminNavItems } from './AdminSidebar';
import { Icon } from './icons';

const AdminBottomNav = ({ activeTab, setActiveTab, userRole = 'admin' }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const filteredNavItems = userRole === 'coadmin'
    ? adminNavItems.filter(item => item.id !== 'users')
    : adminNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {filteredNavItems.slice(0, 4).map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`
              flex flex-col items-center justify-center flex-1 min-w-0 transition-colors duration-200
              ${activeTab === item.id
                ? 'text-primary-700 bg-amber-50'
                : 'text-slate-500 hover:text-primary-600 hover:bg-slate-50'
              }
            `}
          >
            <Icon name={item.iconName} className="w-5 h-5 mb-0.5" strokeWidth={2} />
            <span className="text-[10px] font-medium truncate max-w-[4.5rem] text-center leading-tight">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 min-w-0 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Icon name="logout" className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminBottomNav;
