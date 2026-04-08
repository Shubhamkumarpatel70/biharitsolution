import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';
import Logo from './Logo';
import { Icon } from './icons';

const primaryNavLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/plans', label: 'Plans' },
  { to: '/features', label: 'Features' },
];

const moreNavLinks = [
  { to: '/services', label: 'Services' },
  { to: '/team', label: 'Our Team' },
  { to: '/careers', label: 'Careers' },
  { to: '/contact', label: 'Contact' },
];

function isMoreNavActive(pathname) {
  return moreNavLinks.some((l) => l.to === pathname);
}

function Navbar() {
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreNavOpen, setMoreNavOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const moreNavRef = useRef(null);
  const moreActive = isMoreNavActive(location.pathname);

  const isUserDashboardShell =
    user &&
    user.role !== 'admin' &&
    user.role !== 'coadmin' &&
    location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setUserMenuOpen(false);
    setMoreNavOpen(false);
    setMobileMoreOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.nav-user-menu')) {
        setUserMenuOpen(false);
      }
      if (moreNavOpen && moreNavRef.current && !moreNavRef.current.contains(event.target)) {
        setMoreNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, moreNavOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setMoreNavOpen(false);
      setUserMenuOpen(false);
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen && moreActive) setMobileMoreOpen(true);
  }, [isMobileMenuOpen, moreActive]);

  const toggleMobileMenu = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setUserMenuOpen(false);
    navigate('/login');
  };

  const getAvatar = () => {
    if (user && user.name) {
      return user.name[0].toUpperCase();
    }
    return <Icon name="user" className="w-4 h-4" />;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[2000] transition-all duration-300 rounded-[20px] overflow-visible my-2 mx-3 ${
          isScrolled
            ? 'bg-white/95 border-b border-gray-200 shadow-md backdrop-blur-xl'
            : 'bg-white/80 backdrop-blur-xl border border-gray-100 shadow-sm'
        } lg:my-2 lg:mx-3 lg:rounded-[20px] md:my-0 md:mx-0 md:rounded-none`}
        aria-label="Main Navigation"
      >
        <div className="container">
          <div className="flex items-center justify-between h-20">
            <Link
              to="/"
              className="flex items-center no-underline z-[1100] min-w-0 shrink"
              aria-label="Home"
              title="askc web"
            >
              <Logo showText={true} size="default" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`group relative text-text-main no-underline font-medium text-sm xl:text-base py-2 px-2 xl:px-3 transition-colors duration-200 whitespace-nowrap ${
                    location.pathname === link.to ? 'text-primary-600 font-semibold' : 'hover:text-primary-500'
                  }`}
                  tabIndex={0}
                >
                  {link.label}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2px] bg-primary-600 origin-left transition-transform duration-200 ${
                      location.pathname === link.to ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              ))}

              {/* More: Services, Team, Contact */}
              <div className="relative nav-more-menu" ref={moreNavRef}>
                <button
                  type="button"
                  className={`relative flex items-center gap-1 text-sm xl:text-base font-medium py-2 px-2 xl:px-3 rounded-lg transition-colors whitespace-nowrap ${
                    moreActive ? 'text-primary-600 font-semibold' : 'text-text-main hover:text-primary-500'
                  }`}
                  onClick={() => setMoreNavOpen((o) => !o)}
                  aria-expanded={moreNavOpen}
                  aria-haspopup="true"
                  aria-controls="nav-more-dropdown"
                  id="nav-more-button"
                >
                  More
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${moreNavOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2px] bg-primary-600 transition-transform duration-200 origin-left ${
                      moreActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
                {moreNavOpen && (
                  <div
                    id="nav-more-dropdown"
                    role="menu"
                    aria-labelledby="nav-more-button"
                    className="absolute right-0 top-[calc(100%+0.35rem)] min-w-[13rem] py-2 bg-white rounded-xl shadow-xl border border-gray-200 z-[60] overflow-hidden"
                  >
                    {moreNavLinks.map((link) => (
                      <Link
                        key={link.to}
                        role="menuitem"
                        to={link.to}
                        className={`block px-4 py-2.5 text-sm no-underline transition-colors whitespace-nowrap rounded-lg mx-1 ${
                          location.pathname === link.to
                            ? 'bg-gray-100 text-primary-800 font-semibold'
                            : 'text-text-main hover:bg-gray-100 hover:text-primary-700'
                        }`}
                        onClick={() => setMoreNavOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Auth / User */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {user ? (
                <div className="relative nav-user-menu">
                  <button
                    type="button"
                    className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-2 text-text-main font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 max-w-[14rem]"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                  >
                    <span className="w-8 h-8 shrink-0 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold shadow-sm">
                      {getAvatar()}
                    </span>
                    <span className="truncate">{user.name || 'User'}</span>
                    <span className="text-xs shrink-0 transition-transform duration-200">▼</span>
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[12rem] bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        to={user.role === 'admin' || user.role === 'coadmin' ? '/admin-dashboard' : '/dashboard'}
                        className="block px-4 py-3 text-text-main no-underline text-[0.9375rem] transition-all duration-200 hover:bg-gray-50 hover:text-primary-600 flex items-center gap-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Icon name="dashboard" className="w-4 h-4 text-primary-600" />
                        <span>{user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}</span>
                      </Link>
                      <div className="h-px bg-gray-200" />
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 text-danger-500 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-danger-50 flex items-center gap-2"
                        onClick={handleLogout}
                      >
                        <Icon name="logout" className="w-4 h-4 text-danger-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="btn btn-primary px-4 xl:px-5" aria-label="Login">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-secondary px-4 xl:px-5" aria-label="Register">
                    Register
                  </Link>
                </div>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-2 shrink-0 z-[1100]">
              {isUserDashboardShell && (
                <Link
                  to="/dashboard/notifications"
                  className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
                    location.pathname.startsWith('/dashboard/notifications')
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
                      : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50 hover:border-gray-300'
                  }`}
                  aria-label="Notifications"
                >
                  <Icon name="bell" className="w-5 h-5" strokeWidth={2} />
                </Link>
              )}
              <button
                type="button"
                className={`flex flex-col justify-center items-center w-10 h-10 bg-white border border-gray-200 rounded-lg cursor-pointer p-0 transition-all duration-300 relative hover:bg-gray-50 hover:border-gray-300 hover:scale-105 ${
                  isMobileMenuOpen ? 'bg-gray-100 border-gray-300' : ''
                }`}
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span
                  className={`block w-5 h-0.5 bg-text-main rounded-sm transition-all duration-300 absolute ${
                    isMobileMenuOpen ? 'top-[18px] rotate-45 bg-danger-500' : 'top-2.5'
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 bg-text-main rounded-sm transition-all duration-300 absolute top-[18px] ${
                    isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 bg-text-main rounded-sm transition-all duration-300 absolute ${
                    isMobileMenuOpen ? 'top-[18px] -rotate-45 bg-danger-500' : 'top-[26px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[2100] transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'
          }`}
          onClick={toggleMobileMenu}
          aria-hidden={!isMobileMenuOpen}
        >
          <div
            className={`absolute top-0 right-0 w-full max-w-[22rem] h-screen bg-white border-l border-gray-200 p-8 pt-20 overflow-y-auto shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            } md:max-w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-text-main cursor-pointer transition-all duration-300 z-10 hover:bg-danger-50 hover:border-danger-200 hover:text-danger-500 hover:rotate-90 hover:scale-110 active:scale-95"
              onClick={toggleMobileMenu}
              aria-label="Close menu"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="flex flex-col gap-1 mb-8">
              {primaryNavLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-text-main text-lg font-medium no-underline px-4 py-3 rounded-xl transition-all duration-300 border border-transparent ${
                    location.pathname === link.to
                      ? 'bg-gray-100 border-gray-200 text-primary-800'
                      : 'hover:text-primary-700 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                  onClick={toggleMobileMenu}
                >
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                className={`flex items-center justify-between text-left text-lg font-medium px-4 py-3 rounded-xl border transition-all duration-300 ${
                  mobileMoreOpen || moreActive ? 'bg-gray-100 border-gray-200 text-primary-800' : 'border-transparent hover:bg-gray-50 text-text-main'
                }`}
                onClick={() => setMobileMoreOpen((v) => !v)}
                aria-expanded={mobileMoreOpen}
              >
                <span>More</span>
                <svg
                  className={`w-5 h-5 shrink-0 transition-transform ${mobileMoreOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mobileMoreOpen && (
                <div className="pl-2 border-l-2 border-gray-200 ml-4 flex flex-col gap-1">
                  {moreNavLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`text-base font-medium no-underline px-4 py-2.5 rounded-lg transition-colors ${
                        location.pathname === link.to
                          ? 'text-primary-800 bg-gray-100 font-semibold'
                          : 'text-text-main hover:bg-gray-50 hover:text-primary-700'
                      }`}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                      onClick={toggleMobileMenu}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t border-gray-100 pt-6">
              {user ? (
                <div className="relative nav-user-menu">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-text-main font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 mb-2"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-haspopup="true"
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                  >
                    <span className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold shadow-sm">
                      {getAvatar()}
                    </span>
                    <span className="truncate">{user.name || 'User'}</span>
                    <span className="text-xs ml-1 shrink-0">▼</span>
                  </button>
                  <div
                    className={`w-full bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden ${
                      userMenuOpen ? 'block' : 'hidden'
                    }`}
                    tabIndex={-1}
                  >
                    <Link
                      to={user.role === 'admin' || user.role === 'coadmin' ? '/admin-dashboard' : '/dashboard'}
                      className="block text-text-main px-4 py-3.5 mx-1 my-1 rounded-lg transition-all duration-200 hover:bg-gray-50 hover:text-primary-600"
                      onClick={toggleMobileMenu}
                    >
                      {user.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
                    </Link>
                    <div className="h-px bg-gray-100 mx-2" />
                    <button
                      type="button"
                      className="w-full text-left text-danger-500 px-4 py-3.5 mx-1 my-1 rounded-lg bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-danger-50"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="btn btn-primary w-full justify-center py-3.5 px-6 text-base rounded-[10px]"
                    onClick={toggleMobileMenu}
                    aria-label="Login"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-secondary w-full justify-center py-3.5 px-6 text-base rounded-[10px]"
                    onClick={toggleMobileMenu}
                    aria-label="Register"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
