import React, { useState, useEffect } from 'react';

function Services() {
  const [isVisible, setIsVisible] = useState(false);
  const miniServices = [
    { title: 'Web Design', icon: '🎨', color: '#4facfe', price: 'From ₹1,999' },
    { title: 'Web Development', icon: '💻', color: '#667eea', price: 'From ₹3,999' },
    { title: 'E-commerce', icon: '🛒', color: '#764ba2', price: 'From ₹6,499' },
    { title: 'UI/UX', icon: '🧩', color: '#f093fb', price: 'From ₹2,499' },
    { title: 'Maintenance', icon: '🔧', color: '#43e97b', price: 'From ₹999/mo' },
    { title: 'SEO/Marketing', icon: '🚀', color: '#fa709a', price: 'From ₹1,999/mo' },
    { title: 'Speed Optimization', icon: '⚡', color: '#ffb703', price: 'From ₹1,499' },
    { title: 'Landing Page', icon: '📄', color: '#06d6a0', price: 'From ₹1,999' },
    { title: 'Portfolio Site', icon: '🗂️', color: '#00b4d8', price: 'From ₹2,499' },
    { title: 'Blog Setup', icon: '✍️', color: '#f77f00', price: 'From ₹1,499' },
    { title: 'CMS Development', icon: '🧱', color: '#9b5de5', price: 'From ₹4,999' },
    { title: 'Domain & Hosting', icon: '🌐', color: '#118ab2', price: 'At Cost' },
    { title: 'Logo Design', icon: '🖌️', color: '#ef476f', price: 'From ₹999' },
    { title: 'Brand Kit', icon: '🎯', color: '#ffd166', price: 'From ₹1,999' },
    { title: 'Analytics Setup', icon: '📊', color: '#06d6a0', price: 'From ₹799' },
    { title: 'Chatbot Integration', icon: '🤖', color: '#00b4d8', price: 'From ₹2,499' },
    { title: 'Payment Integration', icon: '💳', color: '#8338ec', price: 'From ₹1,999' },
    { title: 'Multi-language', icon: '🌍', color: '#3a86ff', price: 'From ₹2,499' },
    { title: 'PWA Setup', icon: '📱', color: '#8ac926', price: 'From ₹2,999' },
    { title: 'Site Migration', icon: '🚛', color: '#ff595e', price: 'From ₹1,999' },
    { title: 'Bug Fixes', icon: '🛠️', color: '#2a9d8f', price: 'From ₹499' }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-light text-text-main pt-24">
      <section className="services-section py-16 md:py-24">
        <div className="container">
          {/* Section Header */}
          <div className="section-header">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">
              Comprehensive web development solutions tailored to your business needs
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {miniServices.map((item, idx) => (
              <div
                key={item.title}
                className={`group relative bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-md transition-all duration-300 hover:bg-white hover:border-accent-500/50 hover:-translate-y-1 hover:shadow-gold-hover ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  animationDelay: `${idx * 0.06}s`,
                  transitionDelay: `${idx * 0.06}s`
                }}
              >
                {/* Icon */}
                <div 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl md:text-3xl mb-3 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ 
                    background: `${item.color}20`, 
                    color: item.color 
                  }}
                >
                  {item.icon}
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm md:text-base text-text-main group-hover:text-accent-500 transition-colors duration-300">
                    {item.title}
                  </h3>
                  {item.price && (
                    <p 
                      className="text-xs md:text-sm font-medium"
                      style={{ color: item.color }}
                    >
                      {item.price}
                    </p>
                  )}
                </div>

                {/* Hover Effect */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl transition-all duration-300 group-hover:h-1.5"
                  style={{ background: item.color }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Services;
