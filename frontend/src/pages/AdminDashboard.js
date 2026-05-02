import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import AdminFunds from './AdminFunds';
import AdminContacts from './AdminContacts';
import AdminRenewalRequests from './AdminRenewalRequests';
import AdminNewsletter from './AdminNewsletter';
import AdminCoupons from './AdminCoupons';
import AdminTeam from './AdminTeam';
import AdminFeatures from './AdminFeatures';
import AdminServices from './AdminServices';
import AdminPaymentOptions from './AdminPaymentOptions';
import AdminCareers from './AdminCareers';
import AdminCareerApplications from './AdminCareerApplications';
import AdminPromotionalEmail from './AdminPromotionalEmail';
import AdminPromotionalUnsubscribed from './AdminPromotionalUnsubscribed';
import AdminIDCard from './AdminIDCard';
import { Icon } from '../components/icons';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();

  const getUserRole = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.role || 'admin';
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
    return 'admin';
  };

  const userRole = getUserRole();
  const isCoAdmin = userRole === 'coadmin';
  const roleLabel = isCoAdmin ? 'Co-Admin' : 'Admin';
  const roleDescription = isCoAdmin
    ? 'Operational control with scoped permissions.'
    : 'Full platform governance and approvals.';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const renderContent = () => {
    if (activeTab === 'users' && isCoAdmin) {
      return <AdminHome />;
    }

    switch (activeTab) {
      case 'home':
        return <AdminHome />;
      case 'approve':
        return <AdminApprove />;
      case 'funds':
        return <AdminFunds />;
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
      case 'promotional-email':
        return <AdminPromotionalEmail />;
      case 'promotional-unsubscribed':
        return <AdminPromotionalUnsubscribed />;
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
      case 'careers':
        return <AdminCareers />;
      case 'career-applications':
        return <AdminCareerApplications />;
      case 'help':
        return <AdminHelp />;
      case 'id-card':
        return <AdminIDCard />;
      default:
        return <AdminHome />;
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-slate-100 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-[60] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[80] inline-flex items-center gap-2 bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-2.5 shadow-lg hover:bg-slate-800 transition-colors"
        aria-label="Open sidebar"
      >
        <Icon name="menu" className="w-5 h-5" strokeWidth={2.2} />
        <span className="text-xs font-semibold tracking-wide">Menu</span>
      </button>

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-[70] flex flex-col
        h-dvh max-h-dvh lg:h-screen lg:max-h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
      >
        <AdminSidebar
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />
      </aside>

      <main className="flex-1 lg:ml-0 min-h-screen flex flex-col">
        <div className="hidden lg:block bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {roleLabel} Dashboard
                </h1>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                  isCoAdmin
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                {roleDescription}
              </p>
            </div>
            <div className="text-right text-sm text-slate-500 rounded-xl border border-slate-200 px-3 py-2 bg-slate-50">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400">Last refresh</span>
              <span className="font-semibold text-slate-700 tabular-nums">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 pt-14 flex items-center sticky top-0 z-30">
          <div className="flex-1 text-center">
            <h1 className="text-base font-bold text-slate-900">{roleLabel} Dashboard</h1>
            <p className="text-[11px] text-slate-500">Control panel</p>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 bg-gradient-to-b from-slate-100 to-slate-50">
          {renderContent()}
        </div>
      </main>

      <AdminBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={userRole}
        sidebarOpen={sidebarOpen}
      />
    </div>
  );
};

export default AdminDashboard;
