import React, { useState, useEffect } from 'react';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const miniServices = [
  { title: 'Web Design', icon: 'palette', color: '#4facfe', price: 'From ₹1,999' },
  { title: 'Web Development', icon: 'code', color: '#667eea', price: 'From ₹3,999' },
  { title: 'E-commerce', icon: 'cart', color: '#764ba2', price: 'From ₹6,499' },
  { title: 'UI/UX', icon: 'puzzle', color: '#f093fb', price: 'From ₹2,499' },
  { title: 'Maintenance', icon: 'wrench', color: '#43e97b', price: 'From ₹999/mo' },
  { title: 'SEO/Marketing', icon: 'rocket', color: '#fa709a', price: 'From ₹1,999/mo' },
  { title: 'Speed Optimization', icon: 'bolt', color: '#ffb703', price: 'From ₹1,499' },
  { title: 'Landing Page', icon: 'document', color: '#06d6a0', price: 'From ₹1,999' },
  { title: 'Portfolio Site', icon: 'folder', color: '#00b4d8', price: 'From ₹2,499' },
  { title: 'Blog Setup', icon: 'pen', color: '#f77f00', price: 'From ₹1,499' },
  { title: 'CMS Development', icon: 'blocks', color: '#9b5de5', price: 'From ₹4,999' },
  { title: 'Domain & Hosting', icon: 'globe', color: '#118ab2', price: 'At Cost' },
  { title: 'Logo Design', icon: 'brush', color: '#ef476f', price: 'From ₹999' },
  { title: 'Brand Kit', icon: 'target', color: '#ffd166', price: 'From ₹1,999' },
  { title: 'Analytics Setup', icon: 'chart', color: '#06d6a0', price: 'From ₹799' },
  { title: 'Chatbot Integration', icon: 'robot', color: '#00b4d8', price: 'From ₹2,499' },
  { title: 'Payment Integration', icon: 'creditCard', color: '#8338ec', price: 'From ₹1,999' },
  { title: 'Multi-language', icon: 'globe', color: '#3a86ff', price: 'From ₹2,499' },
  { title: 'PWA Setup', icon: 'smartphone', color: '#8ac926', price: 'From ₹2,999' },
  { title: 'Site Migration', icon: 'truck', color: '#ff595e', price: 'From ₹1,999' },
  { title: 'Bug Fixes', icon: 'wrench', color: '#2a9d8f', price: 'From ₹499' }
];

function Services() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-text-main pt-20">
      <PageHero
        eyebrow="Services"
        title="What we build"
        subtitle="From landing pages to full-stack products—clear scope, modern stack, and pricing you can understand."
      />
      <section className="services-section py-12 md:py-20 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our services</h2>
            <p className="section-subtitle">
              Comprehensive web development solutions tailored to your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {miniServices.map((item, idx) => (
              <div
                key={item.title}
                className={`group relative bg-white rounded-xl p-4 sm:p-5 border border-gray-200 shadow-sm transition-all duration-300 hover:border-primary-200 hover:-translate-y-0.5 hover:shadow-md ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  animationDelay: `${idx * 0.04}s`,
                  transitionDelay: `${idx * 0.04}s`
                }}
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: `${item.color}18`,
                    color: item.color
                  }}
                >
                  <Icon name={item.icon} className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm sm:text-base text-text-main group-hover:text-primary-600 transition-colors duration-300 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs font-medium text-text-muted">{item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <section className="mt-12 md:mt-16 border-t border-gray-200 pt-10 md:pt-12" aria-labelledby="pricing-note-heading">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start rounded-xl border border-amber-200/90 bg-amber-50/40 px-4 py-4 md:px-6 md:py-5 shadow-sm">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center border border-amber-200/80">
                  <Icon name="help" className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                </div>
                <div>
                  <h2 id="pricing-note-heading" className="text-base font-bold text-text-main mb-1.5">
                    Note on pricing
                  </h2>
                  <p className="text-sm md:text-base text-text-muted leading-relaxed">
                    <strong className="font-semibold text-text-main">Prices may vary</strong> depending on scope, complexity,
                    timeline, and any custom integrations. Figures shown are indicative starting points only—reach out for an
                    accurate quote for your project.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default Services;
