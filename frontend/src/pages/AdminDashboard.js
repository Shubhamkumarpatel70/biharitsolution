import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar, { adminNavItems } from '../components/AdminSidebar';
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
import AdminPaymentOptions from './AdminPaymentOptions';
import AdminCareers from './AdminCareers';
import AdminCareerApplications from './AdminCareerApplications';
import AdminPromotionalEmail from './AdminPromotionalEmail';
import AdminPromotionalUnsubscribed from './AdminPromotionalUnsubscribed';
import AdminIDCard from './AdminIDCard';
import AdminAgreements from './AdminAgreements';
import AdminClientWork from './AdminClientWork';
import AdminProjects from './AdminProjects';
import { Icon } from '../components/icons';

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const navigate = useNavigate();

  const userRole = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.role || 'admin';
    } catch {
      return 'admin';
    }
  }, []);
  const isCoAdmin = userRole === 'coadmin';
  const roleLabel = isCoAdmin ? 'Co-Admin' : 'Admin';
  const activeItem = adminNavItems.find(item => item.id === activeTab);
  const activeLabel = activeItem?.label || 'Dashboard';

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = event => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const selectTab = tab => {
    setActiveTab(tab);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (activeTab === 'users' && isCoAdmin) return <AdminHome />;
    switch (activeTab) {
      case 'home': return <AdminHome />;
      case 'approve': return <AdminApprove />;
      case 'funds': return <AdminFunds />;
      case 'approved-plans': return <AdminApprovedPlans />;
      case 'cancellations': return <AdminCancellations />;
      case 'project-requests': return <AdminProjectRequests />;
      case 'user-plans': return <AdminUserPlans />;
      case 'users': return <AdminUsers />;
      case 'stats': return <AdminStats />;
      case 'notifications': return <AdminNotifications />;
      case 'plans': return <AdminPlans />;
      case 'contacts': return <AdminContacts />;
      case 'newsletter': return <AdminNewsletter />;
      case 'promotional-email': return <AdminPromotionalEmail />;
      case 'promotional-unsubscribed': return <AdminPromotionalUnsubscribed />;
      case 'renewal-requests': return <AdminRenewalRequests />;
      case 'team': return <AdminTeam />;
      case 'payment-options': return <AdminPaymentOptions />;
      case 'coupons': return <AdminCoupons />;
      case 'careers': return <AdminCareers />;
      case 'career-applications': return <AdminCareerApplications />;
      case 'help': return <AdminHelp />;
      case 'id-card': return <AdminIDCard />;
      case 'agreements': return <AdminAgreements />;
      case 'client-work': return <AdminClientWork />;
      case 'projects-content': return <AdminProjects />;
      default: return <AdminHome />;
    }
  };

  return (
    <div className="min-h-dvh w-full bg-[#f4f6fb] text-slate-800 flex overflow-x-hidden">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      )}

      <aside
        id="admin-navigation"
        aria-label="Admin navigation"
        className={`fixed inset-y-0 left-0 z-[70] h-dvh transform transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:translate-x-0 lg:shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <AdminSidebar
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={selectTab}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
        />
      </aside>

      <div className="min-w-0 flex-1 flex flex-col">
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(15,23,42,0.04)]">
          <div className="min-h-[72px] px-4 sm:px-6 xl:px-8 flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition"
              aria-controls="admin-navigation"
              aria-expanded={sidebarOpen}
              aria-label="Open admin menu"
            >
              <Icon name="menu" className="w-5 h-5" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                <span className="hidden sm:inline">ASKC Technologies</span>
                <span className="hidden sm:inline text-slate-300">/</span>
                <span className="text-sky-700">Control Center</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{activeLabel}</h1>
                <span className="hidden sm:inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-slate-600">{roleLabel}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
              <span className="text-xs font-semibold text-slate-600">System online</span>
            </div>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3 sm:pl-5">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-tight">{roleLabel}</p>
                <p className="text-[10px] text-slate-400 mt-1">Workspace</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                <Icon name="shield" className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="lg:hidden h-px bg-slate-200" />
        </header>

        <main className="flex-1 min-w-0">
          <div className="px-3 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-7 max-w-[1800px] mx-auto w-full">
            <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500">
                  {activeTab === 'home'
                    ? 'Here is an overview of your platform and recent activity.'
                    : `Manage ${activeLabel.toLowerCase()} from one place.`}
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm">
                <Icon name="clock" className="w-3.5 h-3.5" />
                Admin workspace
              </span>
            </div>
            <section key={activeTab} className="admin-dashboard-content min-w-0 animate-[fadeInUp_.22s_ease-out]">
              {renderContent()}
            </section>
          </div>
        </main>

        <footer className="border-t border-slate-200/80 bg-white/70 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3 text-[10px] sm:text-xs text-slate-400">
            <span>ASKC Technologies · Admin Console</span>
            <span className="font-medium">Secure workspace</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
