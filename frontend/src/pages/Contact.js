import React, { useState, useEffect } from 'react';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';
import axios from '../axios';

const contactMethods = [
  {
    title: 'Email',
    content: 'contact@askcweb.in',
    link: 'mailto:contact@askcweb.in',
    icon: 'mail'
  },
  {
    title: 'Phone',
    content: '+91 9027880288',
    link: 'tel:+919027880288',
    icon: 'phone'
  },
  {
    title: 'WhatsApp',
    content: '+91 9027880288',
    link: 'https://wa.me/919027880288',
    icon: 'chat'
  },
  {
    title: 'Location',
    content: 'Bihar, Patna, India',
    icon: 'mapPin'
  }
];

const features = [
  {
    title: 'Quick response',
    description: 'We respond to inquiries quickly during business hours',
    icon: 'bolt'
  },
  {
    title: '24/7 support',
    description: 'Help when you need it across channels',
    icon: 'wrench'
  },
  {
    title: 'Free consultation',
    description: 'Discuss goals, scope, and timeline with zero pressure',
    icon: 'lightbulb'
  }
];

function Contact() {
  const [isVisible, setIsVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      };
      await axios.post('/api/auth/contact', payload);

      setMessage("Thank you for your message! We'll get back to you soon.");
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      console.error('Error submitting contact form:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-text-main pt-20">
      <PageHero
        eyebrow="Contact"
        title="Let’s talk about your project"
        subtitle="Tell us what you’re building—we’ll reply with next steps and a realistic timeline."
      />
      {/* Features Section */}
      <section className="py-10 md:py-14 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 text-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gray-100 text-primary-800 border border-gray-200/80 flex items-center justify-center shadow-sm">
                  <Icon name={feature.icon} className="w-7 h-7" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">{feature.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Contact Information</h2>
            <p className="section-subtitle">
              Get in touch with us through any of these channels
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Methods */}
            <div className="space-y-4">
              {contactMethods.map((method, index) => (
                <div
                  key={method.title}
                  className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                    }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-primary-800 border border-gray-200/80 flex-shrink-0 shadow-sm">
                      <Icon name={method.icon} className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary-600 mb-1">{method.title}</h3>
                      {method.link ? (
                        <a
                          href={method.link}
                          className="text-text-main hover:text-primary-600 transition-colors duration-300"
                          target={method.link.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                        >
                          {method.content}
                        </a>
                      ) : (
                        <p className="text-text-main">{method.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className={`bg-white rounded-xl p-6 md:p-8 border border-gray-200 shadow-sm ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } transition-all duration-500`}
              style={{ transitionDelay: '0.4s' }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-primary-600 mb-2">Send Us a Message</h3>
                <p className="text-text-muted text-sm">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-text-main mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text-main mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-text-main mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-text-main mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="What is this about?"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-text-main mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your project or inquiry"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 bg-white text-text-main resize-none"
                  ></textarea>
                </div>

                {message && (
                  <div className={`p-4 rounded-lg ${message.includes('Thank you')
                    ? 'bg-success-50 text-success-600 border border-success-200'
                    : 'bg-danger-50 text-danger-600 border border-danger-200'
                    }`}>
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full justify-center py-3 font-bold rounded-xl group"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Sending…
                    </span>
                  ) : (
                    <>
                      Send message
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 md:py-20 bg-white">
        <div className="container">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="w-full min-h-[220px] h-[50vh] sm:h-80 md:h-96 max-h-[480px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.5!2d72.8777!3d19.0760!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDA0JzM2LjAiTiA3MsKwNTInNDAuMCJF!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Custom Web Location"
              ></iframe>
            </div>
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-xl font-bold text-primary-600 mb-2">Our Location</h3>
              <p className="text-text-main mb-1">Bihar, Patna, India</p>
              <p className="text-text-muted text-sm">We serve clients worldwide with our remote development services.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gray-50 border-t border-gray-200">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center px-2">
            <h2 className="text-3xl md:text-4xl font-black text-primary-900 mb-4">Ready to start?</h2>
            <p className="text-text-main text-lg mb-8">
              Let's discuss your requirements and create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:contact@askcweb.in" className="btn btn-primary">
                Email Us Now
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <a href="tel:+919027880288" className="btn btn-secondary">
                Call Us Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
