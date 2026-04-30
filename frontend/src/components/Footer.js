import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { Icon } from './icons';
import axios from '../axios';

const quickLinks = [
  { to: '/', label: 'Home' },
  { to: '/careers', label: 'Careers', highlight: true },
  { to: '/about', label: 'About Us' },
  { to: '/services', label: 'Our Services' },
  { to: '/features', label: 'Features' },
  { to: '/team', label: 'Our Team' },
  { to: '/plans', label: 'Pricing Plans' },
  { to: '/contact', label: 'Contact Us' },
];

const serviceLinks = [
  'Web design & development',
  'E-commerce solutions',
  'Custom web applications',
  'Mobile-first UX',
  'SEO & performance',
  'Support & maintenance',
];

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
      const payload = { email: email.trim().toLowerCase() };
      if (subscribeOption === 'subscribe') {
        const res = await axios.post('/api/auth/newsletter/subscribe', payload);
        setNewsletterMsg(res.data?.message || 'Subscribed successfully.');
        setEmail('');
      } else {
        const res = await axios.post('/api/auth/newsletter/unsubscribe', payload);
        setNewsletterMsg(res.data?.message || 'Unsubscribed successfully.');
        setEmail('');
      }
    } catch (error) {
      setNewsletterMsg(error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const colTitleClass =
    'text-sm font-bold uppercase tracking-widest text-accent-400 mb-5 flex items-center gap-2';

  return (
    <footer className="relative bg-primary-700 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-600/40 via-transparent to-primary-900/30 pointer-events-none" />
      <div
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-400/60 to-transparent"
        aria-hidden
      />

      <div className="container relative z-10 py-12 md:py-16 lg:py-20">
        {/* Three main columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-10 mb-14 lg:mb-16">
          {/* Column 1 — Company */}
          <div className="lg:pr-8 xl:pr-10">
            <div title="ASKC Digital Web">
              <Logo showText={true} size="large" theme="dark" />
            </div>
            <p className="text-white/85 text-sm leading-relaxed mt-5 max-w-md">
              We build fast, accessible websites and apps with modern stacks—so your business can grow with a
              dependable digital presence.
            </p>
            <Link
              to="/careers"
              className="group mt-6 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-accent-500/50 px-4 py-3 transition-all duration-300 max-w-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-500/20 text-accent-400 group-hover:bg-accent-500/30">
                <Icon name="briefcase" className="w-5 h-5" strokeWidth={2} />
              </span>
              <span className="text-left min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wider text-accent-400">We&apos;re hiring</span>
                <span className="block font-bold text-white group-hover:text-accent-300 transition-colors">Careers &amp; open roles</span>
              </span>
              <Icon
                name="arrowRight"
                className="w-5 h-5 text-white/50 group-hover:text-accent-400 shrink-0 ml-auto"
                strokeWidth={2}
              />
            </Link>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Follow us</p>
              <a
                href="https://www.instagram.com/askc_digitalweb/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/10 hover:bg-accent-500 text-white border border-white/10 hover:border-accent-400 transition-all duration-300 hover:scale-105"
                aria-label="ASKC Digital Web on Instagram"
                title="Instagram @askc_digitalweb"
              >
                <Icon name="instagram" className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2 — Explore & services */}
          <div className="lg:px-8 xl:px-10 lg:border-x lg:border-white/10 grid sm:grid-cols-2 lg:grid-cols-1 gap-10 sm:gap-12">
            <div>
              <h3 className={colTitleClass}>
                <span className="h-px w-6 bg-accent-500/80 rounded-full shrink-0" aria-hidden />
                Explore
              </h3>
              <ul className="space-y-0.5">
                {quickLinks.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`
                        group flex items-center gap-2 py-2 text-sm rounded-lg px-2 -mx-2 transition-colors
                        ${link.highlight
                          ? 'text-accent-300 font-semibold hover:bg-white/10'
                          : 'text-white/80 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      {link.highlight && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-accent-500 text-primary-900 px-1.5 py-0.5 rounded-md shrink-0">
                          Jobs
                        </span>
                      )}
                      <span className={link.highlight ? '' : 'group-hover:translate-x-0.5 transition-transform'}>
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className={colTitleClass}>
                <span className="h-px w-6 bg-accent-500/80 rounded-full shrink-0" aria-hidden />
                Services
              </h3>
              <ul className="space-y-0.5">
                {serviceLinks.map((service) => (
                  <li key={service}>
                    <Link
                      to="/services"
                      className="block py-2 text-sm text-white/80 hover:text-accent-300 transition-colors"
                    >
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3 — Contact */}
          <div className="lg:pl-8 xl:pl-10">
            <h3 className={colTitleClass}>
              <span className="h-px w-6 bg-accent-500/80 rounded-full shrink-0" aria-hidden />
              Contact
            </h3>
            <div className="space-y-4 max-w-md">
              {[
                { icon: 'mapPin', label: 'Address', value: 'Bihar, Patna, India' },
                { icon: 'mail', label: 'Email', value: 'contact@askcweb.in', link: 'mailto:contact@askcweb.in' },
                { icon: 'phone', label: 'Phone', value: '+91 9027880288', link: 'tel:+919027880288' },
                { icon: 'clock', label: 'Hours', value: 'Mon–Fri: 11AM – 4PM' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-accent-400 border border-white/10">
                    <Icon name={item.icon} className="w-5 h-5" />
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-white/55 uppercase tracking-wide font-semibold mb-0.5">{item.label}</span>
                    {item.link ? (
                      <a href={item.link} className="text-white/90 hover:text-accent-300 text-sm transition-colors break-all">
                        {item.value}
                      </a>
                    ) : (
                      <span className="text-white/90 text-sm">{item.value}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter — full width under the three columns */}
        <div className="rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-sm p-6 md:p-8 lg:p-10 mb-10">
          <div className="max-w-2xl mx-auto text-center mb-6">
            <h3 className="text-xl md:text-2xl font-black text-white mb-2">Stay in the loop</h3>
            <p className="text-white/75 text-sm md:text-base leading-relaxed">
              Product updates, web tips, and occasional notes from the team—no spam.
            </p>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="max-w-xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3.5 rounded-xl bg-primary-900/40 border border-white/20 text-white placeholder-white/45 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/30 transition-all text-sm"
                required
                aria-label="Enter your email address"
              />
              <button
                type="submit"
                className="btn btn-primary px-8 py-3.5 whitespace-nowrap rounded-xl font-bold shadow-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2" aria-label="Loading" role="status">
                    <span className="w-4 h-4 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                    Subscribing…
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-sm" aria-label="Subscription options">
              <label className="flex items-center gap-2 cursor-pointer text-white/85">
                <input
                  type="radio"
                  name="subscribeOption"
                  value="subscribe"
                  checked={subscribeOption === 'subscribe'}
                  onChange={(e) => setSubscribeOption(e.target.value)}
                  className="w-4 h-4 text-accent-500 focus:ring-accent-500 border-white/30"
                  aria-label="Subscribe to our newsletter"
                />
                Subscribe
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-white/85">
                <input
                  type="radio"
                  name="subscribeOption"
                  value="unsubscribe"
                  checked={subscribeOption === 'unsubscribe'}
                  onChange={(e) => setSubscribeOption(e.target.value)}
                  className="w-4 h-4 text-accent-500 focus:ring-accent-500 border-white/30"
                  aria-label="Unsubscribe from our newsletter"
                />
                Unsubscribe
              </label>
            </div>
            {newsletterMsg && (
              <div
                className={`text-center py-3 px-4 rounded-xl text-sm font-medium ${newsletterMsg.includes('Thank you') || newsletterMsg.includes('unsubscribed')
                    ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/25'
                    : 'bg-red-500/15 text-red-200 border border-red-400/25'
                  }`}
                role="status"
                aria-live="polite"
              >
                {newsletterMsg}
              </div>
            )}
          </form>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
          <p className="text-white/55 text-sm text-center sm:text-left">
            © {currentYear} ASKC Digital Web. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link to="/privacy" className="text-white/70 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-white/70 hover:text-white transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/refund" className="text-white/70 hover:text-white transition-colors">
              Refund Policy
            </Link>
            <Link to="/careers" className="text-accent-300 hover:text-accent-200 font-semibold transition-colors">
              Careers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
