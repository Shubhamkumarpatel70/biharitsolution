import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axios';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const planBenefits = [
  {
    title: 'Premium Quality',
    description: 'High-quality websites built with modern technologies and best practices',
    icon: 'star'
  },
  {
    title: 'Fast Delivery',
    description: 'Quick turnaround times without compromising on quality',
    icon: 'rocket'
  },
  {
    title: '24/7 Support',
    description: 'Round-the-clock support to help you with any questions',
    icon: 'chat'
  },
  {
    title: 'Free Updates',
    description: 'Regular updates and maintenance to keep your site running smoothly',
    icon: 'refresh'
  }
];

function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get('/api/auth/plans');
      const plansData = Array.isArray(response.data) ? response.data :
        Array.isArray(response.data.plans) ? response.data.plans : [];
      setPlans(plansData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans. Please try again.');
      setPlans([]);
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const sortedPlans = Array.isArray(plans) ? plans.sort((a, b) => a.price - b.price) : [];

  return (
    <div className="min-h-screen bg-gray-50 text-text-main pt-20">
      <PageHero
        eyebrow="Pricing"
        title="Plans that scale with you"
        subtitle="Transparent pricing, clear deliverables, and support you can count on."
      />
      {/* Benefits Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Our Plans?</h2>
            <p className="section-subtitle">
              Every plan comes with premium features and exceptional value
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {planBenefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 text-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gray-100 text-primary-800 border border-gray-200/80 flex items-center justify-center shadow-sm">
                  <Icon name={benefit.icon} className="w-7 h-7" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">{benefit.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-12 md:py-20 bg-gray-50 relative overflow-hidden scroll-mt-24">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-50 rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10">
          <div className="section-header">
            <h2 className="section-title">Our Pricing Plans</h2>
            <p className="section-subtitle">
              Choose the plan that best fits your business needs
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-muted">Loading plans...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-6 sm:p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/15 text-warning flex items-center justify-center">
                <Icon name="warning" className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-2">Oops! Something went wrong</h3>
              <p className="text-text-muted mb-6">{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Try Again
              </button>
            </div>
          ) : sortedPlans.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-6 sm:p-8 max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 text-primary-800 border border-gray-200 flex items-center justify-center shadow-sm">
                <Icon name="clipboard" className="w-8 h-8" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-text-main mb-2">No Plans Available</h3>
              <p className="text-text-muted mb-6">Currently no pricing plans are available. Please check back later or contact us for custom pricing.</p>
              <Link to="/contact" className="btn btn-primary">
                Contact Us
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {sortedPlans.map((plan, index) => (
                <div
                  key={plan._id || index}
                  className={`group relative bg-white rounded-2xl p-6 md:p-8 border-2 transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-lg ${plan.highlight
                      ? 'border-accent-400 shadow-md bg-amber-50/60 ring-1 ring-accent-200/60'
                      : 'border-gray-200 hover:border-primary-300'
                    } ${selectedPlan?._id === plan._id ? 'border-primary-600 shadow-md' : ''} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                  onClick={() => handlePlanSelect(plan)}
                >
                  {/* Discount Badge - Top Left */}
                  {plan.oldPrice && (
                    <div className="absolute top-2 left-2 bg-danger-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm z-10">
                      {Math.round(((plan.oldPrice - plan.price) / plan.oldPrice) * 100)}% OFF
                    </div>
                  )}

                  {/* Best Value Badge */}
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm tracking-wide flex items-center gap-2 z-10 border border-white">
                      <Icon name="trophy" className="w-4 h-4 text-accent-400" />
                      <span>Best value</span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-6 mt-4">
                    <h3 className="text-2xl font-bold text-primary-700 mb-4">{plan.name}</h3>
                    <div className="mb-4">
                      <div className="text-4xl md:text-5xl font-black text-primary-900 mb-2">
                        ₹{plan.price}
                      </div>
                      {plan.oldPrice && (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg text-text-muted line-through">₹{plan.oldPrice}</span>
                          <span className="text-sm font-semibold text-success-600 bg-success-50 text-success-600 px-2 py-1 rounded-lg">
                            Save ₹{plan.oldPrice - plan.price}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
                      <Icon name="clock" className="w-4 h-4" />
                      <span>{plan.duration} days</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-primary-700 mb-4">
                      <Icon name="sparkles" className="w-5 h-5 text-accent-500" />
                      What&apos;s included
                    </h4>
                    <ul className="space-y-3">
                      {Array.isArray(plan.features) && plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-text-main">
                          <span className="text-primary-600 font-bold text-lg flex-shrink-0">✓</span>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    to={`/payment/${plan.name.toLowerCase().replace(/\s+/g, '')}`}
                    className="btn btn-primary w-full justify-center py-3 font-medium group rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="transition-colors duration-300">Get started</span>
                    <span className="transition-all duration-300 group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Frequently asked questions</h2>
            <p className="section-subtitle">
              Get answers to common questions about our plans and services
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {[
              {
                icon: 'help',
                question: "What's included in each plan?",
                answer: "Each plan includes responsive design, SEO optimization, content management system, contact forms, and 24/7 support. Higher-tier plans include additional features like e-commerce functionality and advanced analytics."
              },
              {
                icon: 'clock',
                question: 'How long does it take to complete a project?',
                answer: "Project timelines vary based on complexity. Basic websites typically take 1-2 weeks, while more complex projects may take 3-4 weeks. We'll provide a detailed timeline during the planning phase."
              },
              {
                icon: 'chat',
                question: 'Do you provide ongoing support?',
                answer: 'Yes! All plans include 24/7 support and regular updates. We also offer maintenance packages to keep your website secure and up-to-date with the latest features.'
              },
              {
                icon: 'refresh',
                question: 'Can I upgrade my plan later?',
                answer: "Absolutely! You can upgrade your plan at any time. We'll work with you to add new features and functionality to your existing website without any downtime."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${(index + 1) * 0.1}s` }}
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gray-100 text-primary-800 border border-gray-200/80 flex items-center justify-center shadow-sm">
                  <Icon name={faq.icon} className="w-6 h-6" strokeWidth={2} />
                </div>
                <h4 className="text-lg font-semibold text-primary-600 mb-2">{faq.question}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gray-50 border-t border-gray-200">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center px-2">
            <h2 className="text-3xl md:text-4xl font-black text-primary-900 mb-4">Ready to get started?</h2>
            <p className="text-text-main text-lg mb-8">
              Choose your plan and let&apos;s create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/plans#plans" className="btn btn-primary group rounded-xl">
                <span>View all plans</span>
                <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>
              <Link to="/contact" className="btn btn-secondary">
                <span>Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Plans;
