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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh bg-slate-100 flex relative">
      {sidebarOpen && <button type="button" aria-label="Close dashboard menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-[80] bg-slate-950/55 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-[90] h-dvh max-h-dvh transform transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 lg:shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar onLogout={handleLogout} user={user} onClose={() => setSidebarOpen(false)} />
      </aside>
      <main className="flex-1 min-w-0 min-h-screen flex flex-col">
        <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur lg:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open dashboard sidebar" aria-expanded={sidebarOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700"><span className="text-xl leading-none">☰</span></button>
          <div className="min-w-0"><p className="text-sm font-bold text-slate-900">ASKC Technologies</p><p className="text-xs text-slate-500">User Dashboard</p></div>
        </div>
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-full min-w-0"><Outlet context={{ user }} /></div>
      </main>
    </div>
  );
}

export default Dashboard;
