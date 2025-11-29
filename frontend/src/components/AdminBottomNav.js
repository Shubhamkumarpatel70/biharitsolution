import React from 'react';
import { useNavigate } from 'react-router-dom';
import { adminNavItems } from './AdminSidebar';

const AdminBottomNav = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-50 lg:hidden">
      <div className="flex items-center justify-around h-16">
        {adminNavItems.slice(0, 4).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              flex flex-col items-center justify-center flex-1 h-full
              transition-colors duration-200
              ${activeTab === item.id 
                ? 'text-success-500 bg-success-500/10' 
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full text-danger-400 hover:text-danger-500 transition-colors duration-200"
        >
          <span className="text-xl mb-1">🚪</span>
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminBottomNav;
