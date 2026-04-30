import React, { useState, useEffect } from 'react';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const miniServices = [
  { title: 'Web Design', icon: 'palette', color: '#4facfe' },
  { title: 'Web Development', icon: 'code', color: '#667eea' },
  { title: 'E-commerce', icon: 'cart', color: '#764ba2' },
  { title: 'UI/UX', icon: 'puzzle', color: '#f093fb' },
  { title: 'Maintenance', icon: 'wrench', color: '#43e97b' },
  { title: 'SEO/Marketing', icon: 'rocket', color: '#fa709a' },
  { title: 'Speed Optimization', icon: 'bolt', color: '#ffb703' },
  { title: 'Landing Page', icon: 'document', color: '#06d6a0' },
  { title: 'Portfolio Site', icon: 'folder', color: '#00b4d8' },
  { title: 'Blog Setup', icon: 'pen', color: '#f77f00' },
  { title: 'CMS Development', icon: 'blocks', color: '#9b5de5' },
  { title: 'Domain & Hosting', icon: 'globe', color: '#118ab2' },
  { title: 'Logo Design', icon: 'brush', color: '#ef476f' },
  { title: 'Brand Kit', icon: 'target', color: '#ffd166' },
  { title: 'Analytics Setup', icon: 'chart', color: '#06d6a0' },
  { title: 'Chatbot Integration', icon: 'robot', color: '#00b4d8' },
  { title: 'Payment Integration', icon: 'creditCard', color: '#8338ec' },
  { title: 'Multi-language', icon: 'globe', color: '#3a86ff' },
  { title: 'PWA Setup', icon: 'smartphone', color: '#8ac926' },
  { title: 'Site Migration', icon: 'truck', color: '#ff595e' },
  { title: 'Bug Fixes', icon: 'wrench', color: '#2a9d8f' }
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
        subtitle="From landing pages to full-stack products—clear scope, modern stack, and solutions you can understand."
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;
