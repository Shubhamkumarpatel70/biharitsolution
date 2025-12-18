import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axios';

const values = [
  {
    title: 'Innovation',
    desc: 'We stay updated with the latest trends and best practices',
    icon: '💡'
  },
  {
    title: 'Collaboration',
    desc: 'Working together to achieve the best results for our clients',
    icon: '🤝'
  },
  {
    title: 'Excellence',
    desc: 'Committed to delivering high-quality solutions every time',
    icon: '⭐'
  },
  {
    title: 'Growth',
    desc: 'Continuously learning and improving our skills and processes',
    icon: '📈'
  }
];

const perks = [
  {
    title: 'Flexible Work Environment',
    desc: 'Work from anywhere with our remote-friendly culture',
    icon: '🏠'
  },
  {
    title: 'Professional Development',
    desc: 'Continuous learning opportunities and skill development',
    icon: '📚'
  },
  {
    title: 'Competitive Benefits',
    desc: 'Health insurance, paid time off, and performance bonuses',
    icon: '💰'
  },
  {
    title: 'Team Events',
    desc: 'Regular team building activities and social events',
    icon: '🎉'
  }
];

function Team() {
  const [isVisible, setIsVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/team');
      const members = response.data.teamMembers || [];
      // Sort by order field
      const sortedMembers = members.sort((a, b) => (a.order || 0) - (b.order || 0));
      setTeamMembers(sortedMembers);
      setError(null);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-light text-text-main pt-24">
      {/* Team Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Talented Team</h2>
            <p className="section-subtitle">
              Meet the professionals who make your projects successful
            </p>
          </div>
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-muted">Loading team members...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-text-main mb-2">Oops! Something went wrong</h3>
              <p className="text-text-muted mb-6">{error}</p>
              <button onClick={fetchTeamMembers} className="btn btn-primary">
                Try Again
              </button>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8 max-w-md mx-auto">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-text-main mb-2">No Team Members</h3>
              <p className="text-text-muted">Team members will appear here once they are added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={member._id || member.name} 
                  className={`group relative bg-white rounded-xl p-5 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  {/* Role Badge - Top Right Inside Container */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-block px-4 py-2 bg-[#fef08a] text-black rounded-lg text-xs font-bold whitespace-nowrap shadow-md border border-yellow-300/30">
                      {member.position || member.role}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {/* Avatar - Left Side */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-accent rounded-full flex items-center justify-center text-xl font-black text-primary-900 border-4 border-white shadow-gold">
                        {member.profileImage ? (
                          <img
                            src={member.profileImage}
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{member.name.split(' ').map(n => n[0]).join('')}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content - Right Side */}
                    <div className="flex-1 relative min-h-[80px]">
                      {/* Name - Below Role Badge */}
                      <h3 className="text-lg font-bold text-primary-600 mb-2 pr-32 pt-8 whitespace-nowrap overflow-hidden text-ellipsis">
                        {member.name}
                      </h3>

                      {/* Bio */}
                      <p className="text-text-muted text-sm leading-relaxed line-clamp-3">
                        {member.bio || 'Team member at askc web'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24 bg-gray-light">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Our Values</h2>
            <p className="section-subtitle">
              The principles that guide our work and define our success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {values.map((value, index) => (
              <div 
                key={value.title} 
                className={`bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 text-center ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 bg-accent-500/10 rounded-xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-bold text-primary-600 mb-2">
                  {value.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Team Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="section-header">
              <h2 className="section-title">Join Our Team</h2>
              <p className="section-subtitle">
                We're always looking for talented individuals to join our growing team
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {perks.map((perk, index) => (
                <div 
                  key={perk.title} 
                  className={`flex gap-4 p-5 bg-gray-light rounded-xl hover:bg-accent-500/5 transition-all duration-300 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                >
                  <div className="text-3xl flex-shrink-0">{perk.icon}</div>
                  <div>
                    <h4 className="font-semibold text-text-main mb-1">{perk.title}</h4>
                    <p className="text-sm text-text-muted">{perk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary">
                Apply Now
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link to="/about" className="btn btn-secondary bg-white text-primary-600 border-primary-600 hover:bg-primary-600 hover:text-white">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Work With Our Team?</h2>
            <p className="text-white/90 text-lg mb-8">
              Let's discuss your project and see how our talented team can help bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn btn-primary bg-gradient-accent text-primary-900 hover:shadow-gold-hover">
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

export default Team;
