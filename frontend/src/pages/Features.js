import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const defaultFeatures = [
  {
    title: 'Responsive Design',
    desc: 'Mobile-first approach ensuring your website looks perfect on all devices.',
    icon: 'smartphone',
    details: ['Mobile Optimized', 'Tablet Friendly', 'Desktop Perfect', 'Cross-Browser Compatible']
  },
  {
    title: 'SEO Optimization',
    desc: 'Built-in SEO features to help your website rank higher in search engines.',
    icon: 'search',
    details: ['Meta Tags', 'Schema Markup', 'Fast Loading', 'Clean URLs']
  },
  {
    title: 'Security Features',
    desc: 'Advanced security measures to protect your website and user data.',
    icon: 'shield',
    details: ['SSL Certificate', 'Data Encryption', 'Regular Backups', 'Security Monitoring']
  },
  {
    title: 'Performance Optimization',
    desc: 'Lightning-fast loading speeds for better user experience and SEO.',
    icon: 'bolt',
    details: ['CDN Integration', 'Image Optimization', 'Code Minification', 'Caching']
  },
  {
    title: 'Content Management',
    desc: 'Easy-to-use CMS to manage your website content without technical knowledge.',
    icon: 'document',
    details: ['User-Friendly Admin', 'Media Library', 'Content Editor', 'Role Management']
  },
  {
    title: 'Analytics Integration',
    desc: 'Built-in analytics to track your website performance and user behavior.',
    icon: 'chart',
    details: ['Google Analytics', 'Conversion Tracking', 'User Insights', 'Performance Reports']
  },
  {
    title: 'E-commerce Ready',
    desc: 'Complete e-commerce functionality for online stores and businesses.',
    icon: 'cart',
    details: ['Payment Gateway', 'Inventory Management', 'Order Processing', 'Shopping Cart']
  },
  {
    title: '24/7 Support',
    desc: 'Round-the-clock support to help you with any questions or issues.',
    icon: 'wrench',
    details: ['Live Chat', 'Email Support', 'Phone Support', 'Knowledge Base']
  },
  {
    title: 'Custom Development',
    desc: 'Tailored solutions to meet your specific business requirements.',
    icon: 'cog',
    details: ['Custom Features', 'API Integration', 'Third-party Tools', 'Scalable Architecture']
  }
];

const benefits = [
  {
    title: 'Quality Assurance',
    desc: 'Rigorous testing and quality checks ensure your website works flawlessly.',
    icon: 'check'
  },
  {
    title: 'Fast Delivery',
    desc: 'Quick turnaround times without compromising on quality or features.',
    icon: 'rocket'
  },
  {
    title: 'Affordable Pricing',
    desc: 'Competitive pricing with transparent costs and no hidden fees.',
    icon: 'currency'
  },
  {
    title: 'Ongoing Support',
    desc: 'Continuous support and maintenance to keep your website running smoothly.',
    icon: 'refresh'
  }
];

const comparison = [
  { feature: 'Responsive Design', customWeb: true, competitors: false },
  { feature: 'SEO Optimization', customWeb: true, competitors: false },
  { feature: 'Security Features', customWeb: true, competitors: false },
  { feature: 'Performance Optimization', customWeb: true, competitors: false },
  { feature: 'Content Management', customWeb: true, competitors: false },
  { feature: 'Analytics Integration', customWeb: true, competitors: false },
  { feature: 'E-commerce Ready', customWeb: true, competitors: false },
  { feature: '24/7 Support', customWeb: true, competitors: false },
  { feature: 'Custom Development', customWeb: true, competitors: false }
];

function Features() {
  const [isVisible, setIsVisible] = useState(false);
  const [features] = useState(defaultFeatures);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-light text-text-main pt-20">
      <PageHero
        eyebrow="Features"
        title="Built for performance and trust"
        subtitle="Everything you need to launch, grow, and maintain a serious web presence."
      />
      {/* Features Grid */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What Makes Us Different</h2>
            <p className="section-subtitle">
              Comprehensive features designed to give you the best web development experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className={`group relative bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4">
                  <div className="w-16 h-16 bg-accent-500/15 rounded-xl flex items-center justify-center text-primary-800 border border-accent-500/20 mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Icon name={feature.icon} className="w-8 h-8" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-muted text-sm mb-4 leading-relaxed">{feature.desc}</p>
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-text-main mb-3">Includes:</h4>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-text-main">
                        <span className="text-accent-500 font-bold">✓</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-20 bg-gray-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Custom Web</h2>
            <p className="section-subtitle">
              The advantages that set us apart in the web development industry
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit.title} 
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 text-center ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-accent-500/15 rounded-xl flex items-center justify-center text-primary-800 border border-accent-500/20 mx-auto mb-4">
                  <Icon name={benefit.icon} className="w-8 h-8" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-primary-600 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How we compare</h2>
            <p className="section-subtitle">
              See how our comprehensive features stack up against the competition
            </p>
          </div>
          <div className="max-w-4xl mx-auto overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden min-w-[520px] sm:min-w-0">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-gradient-primary p-3 sm:p-4 text-white font-bold text-sm sm:text-base">
                <div className="text-left pl-1">Feature</div>
                <div className="text-center">ASKC Digital Web</div>
                <div className="text-center">Typical</div>
              </div>
              <div className="divide-y divide-gray-200">
                {comparison.map((item, index) => (
                  <div
                    key={index}
                    className={`grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-gray-light transition-colors duration-200 text-sm sm:text-base ${
                      isVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ transitionDelay: `${index * 0.05}s` }}
                  >
                    <div className="text-text-main font-medium leading-snug">{item.feature}</div>
                    <div className="text-center flex justify-center">
                      {item.customWeb ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-success-500/20 text-success-500 rounded-full">
                          <Icon name="check" className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-danger-500/20 text-danger-600 rounded-full text-sm font-bold">
                          ×
                        </span>
                      )}
                    </div>
                    <div className="text-center flex justify-center">
                      {item.competitors ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-success-500/20 text-success-500 rounded-full">
                          <Icon name="check" className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-danger-500/20 text-danger-600 rounded-full text-sm font-bold">
                          ×
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center px-2">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to use these features?</h2>
            <p className="text-white/90 text-lg mb-8">
              Get started with ASKC Digital Web and ship a site that is fast, secure, and easy to maintain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="btn btn-primary group bg-gradient-accent text-primary-900 hover:shadow-gold-hover border-0 rounded-xl"
              >
                Start your project
                <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>
              <Link
                to="/services"
                className="btn btn-secondary bg-white text-primary-600 border-primary-600 hover:bg-primary-600 hover:text-white rounded-xl"
              >
                View services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Features;
