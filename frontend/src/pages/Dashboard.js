import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import axios from '../axios';
import Sidebar from '../components/Sidebar';

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

  // Close the mobile drawer when the user presses Escape.
  useEffect(() => {
    if (!sidebarOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
          className="fixed inset-x-0 top-14 bottom-0 z-[1900] bg-slate-950/55 lg:hidden"
        />
      )}

      <aside
        id="user-dashboard-sidebar"
        className={`fixed top-14 bottom-0 left-0 z-[1901] h-auto max-h-[calc(100dvh-3.5rem)] w-[min(18rem,86vw)] transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:bottom-auto lg:z-auto lg:h-dvh lg:max-h-dvh lg:w-[15.5rem] lg:shrink-0 lg:translate-x-0 ${
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
        {/* Mobile-only dashboard header. The previous hidden + lg:hidden
            combination hid this trigger at every screen width. */}
        <header className="sticky top-0 z-[1000] flex lg:hidden h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open dashboard sidebar"
            aria-controls="user-dashboard-sidebar"
            aria-expanded={sidebarOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <span className="text-xl leading-none" aria-hidden="true">☰</span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">ASKC Technologies</p>
            <p className="text-xs text-slate-500">User Dashboard</p>
          </div>
        </header>

        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-full min-w-0">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
