import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const highlights = [
  { year: '2022', text: 'Founded askc web', icon: '🚀', description: 'Started our journey with a vision to create amazing digital experiences' },
  { year: '2023', text: '10+ Satisfied Clients', icon: '🤝', description: 'Built trust and delivered exceptional results for our growing client base' },
  { year: '2024', text: '12+ Projects Completed', icon: '🏆', description: 'Successfully launched diverse projects across different industries' },
];

const values = [
  { icon: '💡', label: 'Innovation', description: 'Cutting-edge solutions for modern challenges', features: ['Latest Technologies', 'Creative Solutions', 'Future-Proof Design'] },
  { icon: '🤝', label: 'Customer Focus', description: 'Your success is our priority', features: ['Personalized Approach', '24/7 Support', 'Client Satisfaction'] },
  { icon: '⏰', label: 'On-Time Delivery', description: 'Meeting deadlines with quality', features: ['Project Management', 'Timeline Adherence', 'Quality Assurance'] },
  { icon: '🔒', label: 'Reliability', description: 'Dependable solutions you can trust', features: ['Secure Development', 'Stable Performance', 'Long-term Support'] },
];

function About() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-light text-text-main pt-24">
      {/* Who We Are Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Main Content */}
            <div className="space-y-6">
              <h2 className="section-title text-left">Who We Are</h2>
              <p className="text-text-main leading-relaxed text-lg">
                At <span className="font-bold text-accent-500">askc web</span>, we believe in delivering excellence in every project. Our team is passionate about building creative, innovative, and reliable digital solutions that help our clients grow online.
              </p>
              <p className="text-text-muted leading-relaxed">
                We specialize in creating modern, responsive websites that not only look great but also perform exceptionally well. Our commitment to quality, innovation, and customer satisfaction sets us apart in the competitive web development industry.
              </p>
              <div className="space-y-4 pt-4">
                {[
                  { icon: '🎨', title: 'Web Design & Development', desc: 'Modern, responsive websites built with best practices' },
                  { icon: '🎓', title: 'Education & Client Websites', desc: 'Specialized solutions for educational institutions and businesses' },
                  { icon: '🔧', title: 'Custom Solutions & Bug Fixing', desc: 'Tailored solutions and reliable maintenance services' },
                  { icon: '🚀', title: '24/7 Support & On-Time Delivery', desc: 'Round-the-clock support and guaranteed project delivery' }
                ].map((feature, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-light rounded-xl hover:bg-accent-500/5 transition-colors duration-300">
                    <div className="text-3xl flex-shrink-0">{feature.icon}</div>
                    <div>
                      <h4 className="font-semibold text-text-main mb-1">{feature.title}</h4>
                      <p className="text-sm text-text-muted">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/contact" className="btn btn-primary inline-flex items-center gap-2 mt-6">
                Get Started With Us
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>

            {/* Our Approach */}
            <div className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-bold text-primary-600">Our Approach</h3>
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
                  <div key={idx} className="flex gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-accent-500/50 hover:shadow-md transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-accent text-primary-900 rounded-lg flex items-center justify-center font-black text-lg">
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

      {/* Journey Timeline */}
      <section className="py-16 md:py-24 bg-gray-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Journey</h2>
            <p className="section-subtitle">
              Milestones that define our growth and commitment to excellence
            </p>
          </div>
          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-accent transform md:-translate-x-1/2"></div>
            
            <div className="space-y-12">
              {highlights.map((highlight, index) => (
                <div 
                  key={highlight.year} 
                  className={`relative flex items-center gap-6 md:gap-8 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-500`}
                  style={{ transitionDelay: `${index * 0.2}s` }}
                >
                  {/* Timeline Node */}
                  <div className="absolute left-8 md:left-1/2 w-4 h-4 bg-accent-500 rounded-full border-4 border-white shadow-gold transform md:-translate-x-1/2 z-10"></div>
                  
                  {/* Content Card */}
                  <div className={`flex-1 ml-16 md:ml-0 ${index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'} md:w-5/12`}>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-lg hover:border-accent-500/50 transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-gradient-accent rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {highlight.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-accent-500 mb-1">{highlight.year}</h3>
                          <h4 className="text-lg font-semibold text-text-main mb-2">{highlight.text}</h4>
                          <p className="text-text-muted text-sm">{highlight.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Mission & Values</h2>
            <p className="section-subtitle">
              Our mission is to empower our clients with innovative, reliable, and visually stunning web solutions that help them grow online.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => (
              <div 
                key={value.label} 
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-accent-500/10 rounded-xl flex items-center justify-center text-3xl mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-primary-600 mb-2">{value.label}</h3>
                <p className="text-text-muted text-sm mb-4">{value.description}</p>
                <ul className="space-y-2">
                  {value.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-text-main">
                      <span className="text-accent-500 font-bold">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 h-1 bg-gradient-accent rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Work With Us?</h2>
            <p className="text-white/90 text-lg mb-8">
              Let's discuss your project and create something amazing together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary bg-gradient-accent text-primary-900 hover:bg-gradient-accent hover:shadow-gold-hover">
                Start Your Project
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link to="/services" className="btn btn-secondary bg-white text-primary-600 border-primary-600 hover:bg-primary-600 hover:text-white">
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
