import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../UserContext';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/plans', label: 'Plans' },
  { to: '/services', label: 'Services' },
  { to: '/features', label: 'Features' },
  { to: '/team', label: 'Our Team' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const location = useLocation();
  const { user, setUser } = useContext(UserContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

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
      if (e.key === 'Escape' && isMobileMenuOpen) {
        toggleMobileMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 400);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setDropdownOpen(false);
    navigate('/login');
  };

  const getAvatar = () => {
    if (user && user.name) {
      return user.name[0].toUpperCase();
    }
    return <span role="img" aria-label="User">👤</span>;
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-[2000] transition-all duration-300 rounded-[20px] overflow-visible my-2 mx-3 ${
          isScrolled 
            ? 'bg-primary-600/95 border-b border-accent-500/20 shadow-lg backdrop-blur-xl' 
            : 'bg-primary-600/90 backdrop-blur-xl'
        } lg:my-2 lg:mx-3 lg:rounded-[20px] md:my-0 md:mx-0 md:rounded-none`}
        aria-label="Main Navigation"
      >
        <div className="container">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center no-underline font-extrabold text-2xl text-text-invert z-[1100]" 
              aria-label="Home" 
              title="askc web"
            >
              <span className="bg-gradient-accent bg-clip-text text-transparent tracking-wide font-black">
                askc web
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative text-white no-underline font-medium text-base py-2 transition-colors duration-200 ${
                    location.pathname === link.to 
                      ? 'text-accent-500' 
                      : 'hover:text-accent-500'
                  }`}
                  tabIndex={0}
                >
                  {link.label}
                  <span 
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-accent origin-left transition-transform duration-250 ${
                      location.pathname === link.to ? 'scale-x-100' : 'scale-x-0'
                    } hover:scale-x-100`}
                  />
                </Link>
              ))}
            </div>

            {/* Auth Buttons / User Dropdown */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <div className="relative">
                  <button
                    className="flex items-center gap-2 bg-white/10 border-none rounded-full px-3 py-2 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-white/15"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    aria-label="User menu"
                  >
                    <span className="w-8 h-8 bg-gradient-accent text-primary-900 rounded-full flex items-center justify-center font-semibold shadow-gold">
                      {getAvatar()}
                    </span>
                    <span>{user.name || 'User'}</span>
                    <span className="text-xs ml-1 transition-transform duration-200">▼</span>
                  </button>
                  {dropdownOpen && (
                    <div 
                      className="absolute right-0 top-[calc(100%+0.5rem)] min-w-[12rem] bg-white rounded-lg shadow-xl z-50 border border-gray-200 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link 
                        to={(user.role === 'admin' || user.role === 'coadmin') ? '/admin-dashboard' : '/dashboard'} 
                        className="block px-4 py-3 text-text-main no-underline text-[0.9375rem] transition-all duration-200 hover:bg-gray-light hover:text-accent-500 flex items-center gap-2"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span>📊</span>
                        <span>{user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}</span>
                      </Link>
                      <div className="h-px bg-gray-200" />
                      <button 
                        className="w-full text-left px-4 py-3 text-danger-500 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-danger-500/5 flex items-center gap-2"
                        onClick={handleLogout}
                      >
                        <span>🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to='/login' className="btn btn-primary" aria-label="Login">
                    <span role="img" aria-label="Login">🔑</span> Login
                  </Link>
                  <Link to='/register' className="btn btn-secondary" aria-label="Register">
                    <span role="img" aria-label="Register">📝</span> Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className={`lg:hidden flex flex-col justify-center items-center w-10 h-10 bg-white/10 border border-white/20 rounded-lg cursor-pointer p-0 z-[1100] transition-all duration-300 relative hover:bg-white/15 hover:border-white/30 hover:scale-105 ${
                isMobileMenuOpen ? 'bg-danger-500/10 border-danger-500/30' : ''
              }`}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span 
                className={`block w-5 h-0.5 bg-text-invert rounded-sm transition-all duration-300 absolute ${
                  isMobileMenuOpen 
                    ? 'top-[18px] rotate-45 bg-danger-500' 
                    : 'top-2.5'
                }`}
              />
              <span 
                className={`block w-5 h-0.5 bg-text-invert rounded-sm transition-all duration-300 absolute top-[18px] ${
                  isMobileMenuOpen ? 'opacity-0 scale-0' : ''
                }`}
              />
              <span 
                className={`block w-5 h-0.5 bg-text-invert rounded-sm transition-all duration-300 absolute ${
                  isMobileMenuOpen 
                    ? 'top-[18px] -rotate-45 bg-danger-500' 
                    : 'top-[26px]'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
            className={`fixed inset-0 bg-primary-900/90 backdrop-blur-xl z-[2100] transition-opacity duration-300 ${
              isMobileMenuOpen 
                ? 'opacity-100 visible pointer-events-auto' 
                : 'opacity-0 invisible pointer-events-none'
            }`}
          onClick={toggleMobileMenu} 
          aria-hidden={!isMobileMenuOpen}
        >
          <div 
            className={`absolute top-0 right-0 w-full max-w-[22rem] h-screen bg-primary-600 border-l border-accent-500/20 p-8 pt-20 overflow-y-auto shadow-[-10px_0_30px_rgba(0,0,0,0.3)] transition-transform duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
              isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            } md:max-w-full`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/10 border border-white/20 rounded-lg text-text-invert cursor-pointer transition-all duration-300 z-10 hover:bg-danger-500/20 hover:border-danger-500/40 hover:text-danger-500 hover:rotate-90 hover:scale-110 active:scale-95"
              onClick={toggleMobileMenu}
              aria-label="Close menu"
              tabIndex={isMobileMenuOpen ? 0 : -1}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            
            <div className="flex flex-col gap-2 mb-12">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-white text-lg font-medium no-underline px-6 py-4 rounded-xl transition-all duration-300 relative overflow-hidden border border-transparent ${
                    location.pathname === link.to
                      ? 'bg-accent-500/20 border-accent-500/50 text-accent-500 translate-x-2'
                      : 'hover:text-accent-500 hover:bg-accent-500/15 hover:border-accent-500/40 hover:translate-x-2'
                  }`}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                  onClick={toggleMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            
            <div className="flex flex-col gap-4">
              {user ? (
                <div className="relative">
                  <button
                    className="w-full flex items-center justify-center gap-2 bg-white/10 border-none rounded-xl px-6 py-4 text-white font-medium cursor-pointer transition-all duration-200 hover:bg-white/15 mb-4"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                    aria-label="User menu"
                  >
                    <span className="w-8 h-8 bg-gradient-accent text-primary-900 rounded-full flex items-center justify-center font-semibold shadow-gold">
                      {getAvatar()}
                    </span>
                    <span>{user.name || 'User'}</span>
                    <span className="text-xs ml-1">▼</span>
                  </button>
                  <div 
                    className={`w-full bg-white/5 border border-white/10 rounded-xl mt-2 ${
                      dropdownOpen ? 'block' : 'hidden'
                    }`}
                    tabIndex={-1}
                  >
                    <Link 
                      to={(user.role === 'admin' || user.role === 'coadmin') ? '/admin-dashboard' : '/dashboard'} 
                      className="block text-white px-4 py-3.5 rounded-lg mx-1 my-1 transition-all duration-200 hover:bg-white/10 hover:text-accent-500"
                      onClick={toggleMobileMenu}
                    >
                      {user.role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
                    </Link>
                    <div className="h-px bg-white/10 mx-2" />
                    <button 
                      className="w-full text-left text-white px-4 py-3.5 rounded-lg mx-1 my-1 bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-white/10 hover:text-accent-500"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link 
                    to='/login' 
                    className="btn btn-primary w-full justify-center py-3.5 px-6 text-base rounded-[10px]" 
                    onClick={toggleMobileMenu} 
                    aria-label="Login"
                  >
                    <span role="img" aria-label="Login">🔑</span> Login
                  </Link>
                  <Link 
                    to='/register' 
                    className="btn btn-secondary w-full justify-center py-3.5 px-6 text-base rounded-[10px]" 
                    onClick={toggleMobileMenu} 
                    aria-label="Register"
                  >
                    <span role="img" aria-label="Register">📝</span> Register
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
