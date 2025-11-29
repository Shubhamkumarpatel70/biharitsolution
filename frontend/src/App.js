import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Plans from './pages/Plans';
import Services from './pages/Services';
import Features from './pages/Features';
import Team from './pages/Team';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import HelpAndSupport from './pages/Help & Support';
import SupportChat from './pages/SupportChat';
import Subscription from './pages/Subscription';
import MyPurchases from './pages/MyPurchases';
import Notifications from './pages/Notifications';
import Payment from './pages/Payment';
import ProjectRequirement from './pages/ProjectRequirement';
import AdminDashboard from './pages/AdminDashboard';
import AdminHome from './pages/AdminHome';
import AdminApprove from './pages/AdminApprove';
import AdminUsers from './pages/AdminUsers';
import AdminStats from './pages/AdminStats';
import AdminNotifications from './pages/AdminNotifications';
import AdminPlans from './pages/AdminPlans';
import AdminContacts from './pages/AdminContacts';
import { UserProvider, UserContext } from './UserContext';
import axios from 'axios';

function App() {
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await axios.get('/api/auth/me');
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Could not fetch user', err);
        // Token might be invalid, so clear it
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      }
    };
    checkUser();
  }, [setUser]);

  return (
    <Router>
      <Navbar />
      <AppContent />
      <Footer />
    </Router>
  );
}

function AppContent() {
  return (
    <>
      <main style={{ paddingTop: '70px', minHeight: 'calc(100vh - 70px)' }}>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<About />} />
          <Route path='/plans' element={<Plans />} />
          <Route path='/services' element={<Services />} />
          <Route path='/features' element={<Features />} />
          <Route path='/team' element={<Team />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/dashboard/*' element={<Dashboard />}>
            <Route index element={<DashboardHome />} />
            <Route path='project-requirement' element={<ProjectRequirement />} />
            <Route path='support' element={<HelpAndSupport />} />
            <Route path='subscription' element={<Subscription />} />
            <Route path='purchases' element={<MyPurchases />} />
            <Route path='notifications' element={<Notifications />} />
          </Route>
          <Route path='/payment/:plan' element={<Payment />} />
          <Route path='/admin-dashboard/*' element={<AdminDashboard />}>
            <Route index element={<AdminHome />} />
            <Route path='approve' element={<AdminApprove />} />
            <Route path='users' element={<AdminUsers />} />
            <Route path='stats' element={<AdminStats />} />
            <Route path='notifications' element={<AdminNotifications />} />
            <Route path='plans' element={<AdminPlans />} />
            <Route path='contacts' element={<AdminContacts />} />
          </Route>
          <Route path='/support-chat/:complaintId' element={<SupportChat />} />
        </Routes>
      </main>
    </>
  );
}

const WrappedApp = () => (
  <UserProvider>
    <App />
  </UserProvider>
);

export default WrappedApp; 