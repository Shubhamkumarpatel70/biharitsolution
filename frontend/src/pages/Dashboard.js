import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import axios from '../axios';
import Sidebar from '../components/Sidebar';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
    <div className="min-h-screen min-h-dvh bg-slate-100 flex">
      {/* Sidebar: desktop only — mobile uses bottom nav + main site navbar (notifications) */}
      <aside className="hidden lg:flex lg:static inset-y-0 left-0 z-50 flex-col h-dvh max-h-dvh lg:h-screen lg:max-h-screen shrink-0">
        <Sidebar onLogout={handleLogout} user={user} onClose={() => {}} />
      </aside>

      <main className="flex-1 min-w-0 min-h-screen flex flex-col">
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 w-full max-w-full min-w-0">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
