import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const highlights = [
  { year: '2022', text: 'Founded askc web', icon: 'rocket', description: 'Started our journey with a vision to create amazing digital experiences' },
  { year: '2023', text: '10+ Satisfied Clients', icon: 'users', description: 'Built trust and delivered exceptional results for our growing client base' },
  { year: '2024', text: '12+ Projects Completed', icon: 'trophy', description: 'Successfully launched diverse projects across different industries' },
];

const values = [
  { icon: 'lightbulb', label: 'Innovation', description: 'Cutting-edge solutions for modern challenges', features: ['Latest Technologies', 'Creative Solutions', 'Future-Proof Design'] },
  { icon: 'users', label: 'Customer Focus', description: 'Your success is our priority', features: ['Personalized Approach', '24/7 Support', 'Client Satisfaction'] },
  { icon: 'clock', label: 'On-Time Delivery', description: 'Meeting deadlines with quality', features: ['Project Management', 'Timeline Adherence', 'Quality Assurance'] },
  { icon: 'shield', label: 'Reliability', description: 'Dependable solutions you can trust', features: ['Secure Development', 'Stable Performance', 'Long-term Support'] },
];

function About() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-text-main pt-20">
      <PageHero
        eyebrow="About"
        title="Who we are"
        subtitle="We build modern web experiences for teams that care about quality, speed, and long-term support."
      />
      {/* Who We Are Section */}
      <section className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Main Content */}
            <div className="space-y-6">
              <h2 className="section-title text-left">Who We Are</h2>
              <p className="text-text-main leading-relaxed text-lg">
                At <span className="font-bold text-primary-600">askc web</span>, we believe in delivering excellence in every project. Our team is passionate about building creative, innovative, and reliable digital solutions that help our clients grow online.
              </p>
              <p className="text-text-muted leading-relaxed">
                We specialize in creating modern, responsive websites that not only look great but also perform exceptionally well. Our commitment to quality, innovation, and customer satisfaction sets us apart in the competitive web development industry.
              </p>
              <div className="space-y-4 pt-4">
                {[
                  { icon: 'palette', title: 'Web Design & Development', desc: 'Modern, responsive websites built with best practices' },
                  { icon: 'graduation', title: 'Education & Client Websites', desc: 'Specialized solutions for educational institutions and businesses' },
                  { icon: 'wrench', title: 'Custom Solutions & Bug Fixing', desc: 'Tailored solutions and reliable maintenance services' },
                  { icon: 'rocket', title: '24/7 Support & On-Time Delivery', desc: 'Round-the-clock support and guaranteed project delivery' }
                ].map((feature, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 text-primary-800 border border-gray-200/80 flex items-center justify-center">
                      <Icon name={feature.icon} className="w-6 h-6" strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-main mb-1">{feature.title}</h4>
                      <p className="text-sm text-text-muted">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/contact" className="btn btn-primary group inline-flex items-center gap-2 mt-6 rounded-xl">
                Get started with us
                <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                  →
                </span>
              </Link>
            </div>

            {/* Our Approach */}
            <div className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-primary-900">Our Approach</h3>
              <p className="text-text-muted leading-relaxed">
                We follow a comprehensive approach to web development that ensures every project meets the highest standards of quality and performance.
              </p>
              <div className="space-y-4">
                {[
                  { num: '01', title: 'Discovery & Planning', desc: 'We analyze your requirements and create a detailed project plan' },
                  { num: '02', title: 'Design & Development', desc: 'Create beautiful designs and build robust functionality' },
                  { num: '03', title: 'Testing & Launch', desc: 'Thorough testing and deployment to ensure everything works perfectly' },
                  { num: '04', title: 'Support & Maintenance', desc: 'Ongoing support and maintenance to keep your website running smoothly' }
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-md transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-main mb-1">{step.title}</h4>
                      <p className="text-sm text-text-muted">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey — milestone cards */}
      <section className="py-12 md:py-20 bg-gray-50 border-t border-b border-gray-100">
        <div className="container">
          <div className="section-header max-w-3xl mx-auto">
            <h2 className="section-title">Our Journey</h2>
            <p className="section-subtitle">
              From a single studio to trusted delivery across web, product, and support—every step shaped by client outcomes, not vanity metrics.
            </p>
          </div>

          <div className="relative mt-10 md:mt-14">
            <div
              className="hidden md:block absolute top-11 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-gray-200 via-primary-200 to-gray-200 rounded-full"
              aria-hidden
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
              {highlights.map((highlight, index) => (
                <div
                  key={highlight.year}
                  className={`relative flex flex-col items-center text-center md:items-stretch md:text-left ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-500`}
                  style={{ transitionDelay: `${index * 0.12}s` }}
                >
                  <div className="md:pt-0 flex flex-col md:block">
                    <div className="flex md:hidden items-center justify-center min-w-[3.25rem] px-3 h-12 rounded-full bg-primary-600 text-white font-bold text-sm shadow-md ring-4 ring-white mb-4 z-10">
                      {highlight.year}
                    </div>
                    <div className="hidden md:flex items-center gap-3 mb-5">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white border-2 border-primary-500 text-primary-800 font-bold shadow-sm z-10 ring-4 ring-gray-50">
                        {highlight.year}
                      </span>
                      <span className="h-px flex-1 bg-gray-200 md:hidden" aria-hidden />
                    </div>
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 h-full flex flex-col">
                      <div className="w-14 h-14 mx-auto md:mx-0 mb-4 rounded-xl bg-gray-100 text-primary-800 border border-gray-200/80 flex items-center justify-center shadow-sm">
                        <Icon name={highlight.icon} className="w-7 h-7" strokeWidth={2} />
                      </div>
                      <h3 className="hidden md:block text-sm font-bold text-primary-600 mb-1">{highlight.year}</h3>
                      <h4 className="text-lg font-bold text-text-main mb-2">{highlight.text}</h4>
                      <p className="text-text-muted text-sm leading-relaxed flex-1">{highlight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-12 md:py-20 lg:py-24 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our mission & values</h2>
            <p className="section-subtitle">
              Our mission is to empower our clients with innovative, reliable, and visually stunning web solutions that help them grow online.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => (
              <div
                key={value.label}
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300 hover:-translate-y-1 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-gray-100 text-primary-800 border border-gray-200/80 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  <Icon name={value.icon} className="w-8 h-8" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-bold text-primary-900 mb-2">{value.label}</h3>
                <p className="text-text-muted text-sm mb-4">{value.description}</p>
                <ul className="space-y-2">
                  {value.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-text-main">
                      <span className="text-primary-600 font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 h-1 bg-primary-500 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20 bg-gray-50 border-t border-gray-200">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center px-2">
            <h2 className="text-3xl md:text-4xl font-black text-primary-900 mb-4">Ready to work with us?</h2>
            <p className="text-text-main text-lg mb-8">
              Let's discuss your project and create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary">
                Start Your Project
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link to="/services" className="btn btn-secondary">
                View Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
