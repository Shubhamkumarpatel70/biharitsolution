import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import axios from '../axios';
import Sidebar from '../components/Sidebar';
import { logoutCurrentSession } from '../utils/logout';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios.get('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });
  }, [navigate]);

  // The global navbar owns the dashboard menu trigger on mobile.
  useEffect(() => {
    const toggleSidebar = () => setSidebarOpen((open) => !open);
    const openSidebar = () => setSidebarOpen(true);
    window.addEventListener('askc:toggle-dashboard-sidebar', toggleSidebar);
    window.addEventListener('askc:open-dashboard-sidebar', openSidebar);
    return () => {
      window.removeEventListener('askc:toggle-dashboard-sidebar', toggleSidebar);
      window.removeEventListener('askc:open-dashboard-sidebar', openSidebar);
    };
  }, []);

  // Lock background scrolling while the mobile navigation drawer is open.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sidebarOpen]);

  // Close the mobile drawer when the user presses Escape.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await logoutCurrentSession();
    navigate('/login', { replace: true, state: { message: 'You have been signed out from this device.' } });
  };

  if (loading) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-slate-100 flex relative">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close dashboard menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-x-0 top-[88px] bottom-0 z-[1800] bg-slate-950/45 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        id="user-dashboard-sidebar"
        className={`fixed left-0 top-[88px] bottom-0 z-[1900] h-[calc(100dvh-88px)] max-h-[calc(100dvh-88px)] w-[min(19rem,88vw)] transform transition-transform duration-300 ease-in-out shadow-2xl shadow-slate-950/20 will-change-transform lg:sticky lg:top-0 lg:inset-y-auto lg:z-auto lg:h-dvh lg:max-h-dvh lg:w-[15.5rem] lg:shrink-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          onLogout={handleLogout}
          user={user}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      <main className="flex-1 min-w-0 min-h-screen flex flex-col">
        <div className="h-[88px] shrink-0 lg:hidden" aria-hidden="true" />

        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-full min-w-0">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
