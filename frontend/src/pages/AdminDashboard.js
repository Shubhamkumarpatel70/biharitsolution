import React, { useState } from 'react';
import { Outlet, useNavigate, Routes, Route } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminBottomNav from '../components/AdminBottomNav';
import AdminHelp from './AdminHelp';
import AdminHome from './AdminHome';
import AdminApprove from './AdminApprove';
import AdminApprovedPlans from './AdminApprovedPlans';
import AdminCancellations from './AdminCancellations';
import AdminProjectRequests from './AdminProjectRequests';
import AdminUserPlans from './AdminUserPlans';
import AdminUsers from './AdminUsers';
import AdminStats from './AdminStats';
import AdminNotifications from './AdminNotifications';
import AdminPlans from './AdminPlans';
import AdminContacts from './AdminContacts';
import AdminRenewalRequests from './AdminRenewalRequests';
import AdminNewsletter from './AdminNewsletter';
import AdminCoupons from './AdminCoupons';
import AdminTeam from './AdminTeam';
import AdminFeatures from './AdminFeatures';
import AdminServices from './AdminServices';
import AdminPaymentOptions from './AdminPaymentOptions';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <AdminHome />;
      case 'approve':
        return <AdminApprove />;
      case 'approved-plans':
        return <AdminApprovedPlans />;
      case 'cancellations':
        return <AdminCancellations />;
      case 'project-requests':
        return <AdminProjectRequests />;
      case 'user-plans':
        return <AdminUserPlans />;
      case 'users':
        return <AdminUsers />;
      case 'stats':
        return <AdminStats />;
      case 'notifications':
        return <AdminNotifications />;
      case 'plans':
        return <AdminPlans />;
      case 'contacts':
        return <AdminContacts />;
      case 'newsletter':
        return <AdminNewsletter />;
      case 'renewal-requests':
        return <AdminRenewalRequests />;
      case 'team':
        return <AdminTeam />;
      case 'features':
        return <AdminFeatures />;
      case 'services':
        return <AdminServices />;
      case 'payment-options':
        return <AdminPaymentOptions />;
      case 'coupons':
        return <AdminCoupons />;
      case 'help':
        return <AdminHelp />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-success-500 text-gray-900 border-none rounded-xl px-4 py-2 font-bold text-lg shadow-lg hover:bg-success-600 transition-colors"
        aria-label="Open sidebar"
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar 
          onLogout={handleLogout} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 min-h-screen bg-gray-900">
        {/* Mobile Header */}
        <div className="lg:hidden bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-lg font-bold text-success-500">Admin Dashboard</h1>
          <div className="w-10"></div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6 lg:p-8 lg:ml-0">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <AdminBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default AdminDashboard;
