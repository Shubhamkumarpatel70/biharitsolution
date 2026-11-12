import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import CorporatePage from './pages/CorporatePage';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
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
import AdminApprovedPlans from './pages/AdminApprovedPlans';
import AdminUsers from './pages/AdminUsers';
import AdminStats from './pages/AdminStats';
import AdminNotifications from './pages/AdminNotifications';
import AdminPlans from './pages/AdminPlans';
import AdminContacts from './pages/AdminContacts';
import AdminCancellations from './pages/AdminCancellations';
import AdminIDCard from './pages/AdminIDCard';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Refund from './pages/Refund';
import PublicIDCard from './pages/PublicIDCard';
import UnsubscribeEmail from './pages/UnsubscribeEmail';
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
          // Store user data in localStorage for role checking
          if (res.data.user) {
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
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
  const location = useLocation();
  useEffect(() => {
    const privateRoute = /^\\/(admin-dashboard|dashboard|login|register|payment)(\\/|$)/.test(location.pathname);
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); }
    robots.setAttribute('content', privateRoute ? 'noindex,nofollow' : 'index,follow');
  }, [location.pathname]);
  return (
    <>
      <main className="pt-20 min-h-[calc(100vh-5rem)] w-full max-w-full overflow-x-hidden">
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about' element={<CorporatePage />} />
          <Route path='/services' element={<CorporatePage />} />
          <Route path='/products' element={<CorporatePage />} />
          <Route path='/portfolio' element={<CorporatePage />} />
          <Route path='/industries' element={<CorporatePage />} />
          <Route path='/blog' element={<CorporatePage />} />
          <Route path='/plans' element={<CorporatePage />} />
          <Route path='/features' element={<CorporatePage />} />
          <Route path='/team' element={<CorporatePage />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/careers' element={<Careers />} />
          <Route path='/privacy' element={<Privacy />} />
          <Route path='/terms' element={<Terms />} />
          <Route path='/refund' element={<Refund />} />
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
            <Route path='approved-plans' element={<AdminApprovedPlans />} />
            <Route path='cancellations' element={<AdminCancellations />} />
            <Route path='users' element={<AdminUsers />} />
            <Route path='stats' element={<AdminStats />} />
            <Route path='notifications' element={<AdminNotifications />} />
            <Route path='plans' element={<AdminPlans />} />
            <Route path='contacts' element={<AdminContacts />} />
            <Route path='id-card' element={<AdminIDCard />} />
          </Route>
          <Route path='/id-card/verify/:id' element={<PublicIDCard />} />
          <Route path='/support-chat/:complaintId' element={<SupportChat />} />
          <Route path='/unsubscribe-email' element={<UnsubscribeEmail />} />
          <Route path='*' element={<NotFound />} />
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