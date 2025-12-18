import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axios';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribeOption, setSubscribeOption] = useState('subscribe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setNewsletterMsg('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setNewsletterMsg('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (subscribeOption === 'subscribe') {
        setNewsletterMsg('Thank you for subscribing to our newsletter!');
        setEmail('');
      } else {
        setNewsletterMsg('You have been unsubscribed from our newsletter.');
        setEmail('');
      }
    } catch (error) {
      setNewsletterMsg('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-primary-600 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-500/20 to-accent-600/10"></div>
      </div>

      <div className="container relative z-10 py-12 md:py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mb-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4" title="askc web">
              <span className="text-2xl">🌐</span>
              <span className="text-2xl font-black bg-gradient-accent bg-clip-text text-transparent">askc web</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              We create amazing digital experiences with modern web technologies. 
              From responsive websites to custom applications, we help businesses 
              grow online with innovative solutions.
            </p>
            <div className="flex gap-3 pt-2" aria-label="Social media links">
              {[
                { icon: '📘', label: 'Facebook' },
                { icon: '🐦', label: 'Twitter/X' },
                { icon: '💼', label: 'LinkedIn' },
                { icon: '📷', label: 'Instagram' },
                { icon: '🐙', label: 'GitHub' }
              ].map((social) => (
                <a 
                  key={social.label}
                  href="#" 
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-accent-500 rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-gold"
                  aria-label={social.label}
                  title={social.label}
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent-500">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About Us' },
                { to: '/services', label: 'Our Services' },
                { to: '/features', label: 'Features' },
                { to: '/team', label: 'Our Team' },
                { to: '/plans', label: 'Pricing Plans' },
                { to: '/contact', label: 'Contact Us' }
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-white/80 hover:text-accent-500 transition-colors duration-300 text-sm block py-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent-500">Our Services</h3>
            <ul className="space-y-2">
              {[
                'Web Design & Development',
                'E-commerce Solutions',
                'Custom Web Applications',
                'Mobile-First Design',
                'SEO Optimization',
                '24/7 Support & Maintenance',
                'Performance Optimization'
              ].map((service) => (
                <li key={service}>
                  <Link 
                    to="/services" 
                    className="text-white/80 hover:text-accent-500 transition-colors duration-300 text-sm block py-1"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-accent-500">Contact Info</h3>
            <div className="space-y-4">
              {[
                { icon: '📍', label: 'Address', value: 'Bihar, Patna, India' },
                { icon: '📧', label: 'Email', value: 'official.customweb@gmail.com', link: 'mailto:official.customweb@gmail.com' },
                { icon: '📞', label: 'Phone', value: '+91 9027880288', link: 'tel:+919027880288' },
                { icon: '🕒', label: 'Working Hours', value: 'Mon - Fri: 11AM - 4PM' }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="text-xl flex-shrink-0">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-white/60 uppercase tracking-wide mb-1">{item.label}</span>
                    {item.link ? (
                      <a 
                        href={item.link} 
                        className="text-white/80 hover:text-accent-500 transition-colors duration-300 text-sm"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-white/80 text-sm">{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-white/10 pt-8 md:pt-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-accent-500">Stay Updated</h3>
              <p className="text-white/80 text-sm md:text-base">
                Subscribe to our newsletter for the latest updates, tips, and insights 
                about web development and digital solutions.
              </p>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/50 transition-all duration-300"
                  required
                  aria-label="Enter your email address"
                />
                <button 
                  type="submit" 
                  className="btn btn-primary px-6 py-3 whitespace-nowrap"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2" aria-label="Loading" role="status">
                      <span className="w-4 h-4 border-2 border-primary-900 border-t-transparent rounded-full animate-spin"></span>
                      Subscribing...
                    </span>
                  ) : (
                    <span>Subscribe</span>
                  )}
                </button>
              </div>
              <div className="flex gap-4 justify-center" aria-label="Subscription options">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="subscribeOption"
                    value="subscribe"
                    checked={subscribeOption === 'subscribe'}
                    onChange={(e) => setSubscribeOption(e.target.value)}
                    className="w-4 h-4 text-accent-500 focus:ring-accent-500"
                    aria-label="Subscribe to our newsletter"
                  />
                  <span>Subscribe</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="subscribeOption"
                    value="unsubscribe"
                    checked={subscribeOption === 'unsubscribe'}
                    onChange={(e) => setSubscribeOption(e.target.value)}
                    className="w-4 h-4 text-accent-500 focus:ring-accent-500"
                    aria-label="Unsubscribe from our newsletter"
                  />
                  <span>Unsubscribe</span>
                </label>
              </div>
              {newsletterMsg && (
                <div 
                  className={`text-center py-3 px-4 rounded-lg ${
                    newsletterMsg.includes('Thank you') || newsletterMsg.includes('unsubscribed')
                      ? 'bg-success-500/20 text-success-400 border border-success-500/30'
                      : 'bg-danger-500/20 text-danger-400 border border-danger-500/30'
                  }`}
                  role="status" 
                  aria-live="polite"
                >
                  {newsletterMsg}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-white/60 text-sm">
            © {currentYear} askc web. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
