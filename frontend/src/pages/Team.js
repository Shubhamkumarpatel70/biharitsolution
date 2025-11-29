import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const defaultTeam = [
  {
    name: 'Shubham Patel',
    role: 'Founder & Lead Developer',
    bio: 'Passionate about building creative digital solutions and helping businesses grow online.',
    skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
    experience: '3+ Years',
    projects: '15+ Projects',
    social: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  },
  {
    name: 'Gulshan Kumar',
    role: 'Full-Stack Developer',
    bio: 'Expert team of developers specializing in scalable solutions.',
    skills: ['MERN Stack', 'Python', 'Database Design', 'API Development'],
    experience: '2+ Years',
    projects: '20+ Projects',
    social: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  },
  {
    name: 'Design Team',
    role: 'UI/UX Designers',
    bio: 'Creative designers focused on user experience and modern, responsive web design.',
    skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Responsive Design'],
    experience: '2+ Years',
    projects: '25+ Designs',
    social: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  },
  {
    name: 'Support Team',
    role: '24/7 Customer Support',
    bio: 'Dedicated support specialists ensuring smooth project delivery and client satisfaction.',
    skills: ['Customer Service', 'Technical Support', 'Project Management', 'Communication'],
    experience: '1+ Years',
    projects: '50+ Clients',
    social: {
      linkedin: '#',
      github: '#',
      twitter: '#'
    }
  },
  {
    name: 'Priya Sharma',
    role: 'Frontend Developer',
    bio: 'Creates fast, accessible, and responsive interfaces with React.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Accessibility'],
    experience: '2+ Years',
    projects: '10+ Projects',
    social: { linkedin: '#', github: '#', twitter: '#' }
  },
  {
    name: 'Amit Verma',
    role: 'Backend Developer',
    bio: 'Builds secure APIs and robust backend services.',
    skills: ['Node.js', 'Express', 'MongoDB', 'REST'],
    experience: '3+ Years',
    projects: '12+ Projects',
    social: { linkedin: '#', github: '#', twitter: '#' }
  },
  {
    name: 'Neha Gupta',
    role: 'UI/UX Designer',
    bio: 'Designs delightful user experiences and design systems.',
    skills: ['Figma', 'Wireframing', 'Prototyping', 'Design Systems'],
    experience: '2+ Years',
    projects: '20+ Designs',
    social: { linkedin: '#', github: '#', twitter: '#' }
  },
  {
    name: 'Rahul Singh',
    role: 'DevOps Engineer',
    bio: 'Automates deployments and ensures high availability.',
    skills: ['CI/CD', 'Docker', 'NGINX', 'Linux'],
    experience: '3+ Years',
    projects: '15+ Projects',
    social: { linkedin: '#', github: '#', twitter: '#' }
  }
];

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
  const [teamMembers] = useState(defaultTeam);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {teamMembers.map((member, index) => (
              <div 
                key={member.name} 
                className={`group relative bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 text-center ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Avatar */}
                <div className="mb-4">
                  <div className="w-24 h-24 bg-gradient-accent rounded-full flex items-center justify-center text-2xl font-black text-primary-900 mx-auto border-4 border-white shadow-gold">
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
                
                {/* Role Badge */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-accent-500/10 text-accent-500 rounded-full text-xs font-semibold">
                    {member.role}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-primary-600 mb-2">
                  {member.name}
                </h3>

                {/* Bio */}
                <p className="text-text-muted text-sm mb-4 leading-relaxed">
                  {member.bio}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 mb-4 text-xs text-text-muted">
                  <span>{member.experience}</span>
                  <span>•</span>
                  <span>{member.projects}</span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {member.skills.slice(0, 3).map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 bg-gray-light text-text-main rounded-lg text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-gray-200">
                  <a href={member.social.linkedin} className="w-8 h-8 flex items-center justify-center bg-gray-light hover:bg-accent-500/10 rounded-lg transition-colors duration-300">
                    <span className="text-sm">💼</span>
                  </a>
                  <a href={member.social.github} className="w-8 h-8 flex items-center justify-center bg-gray-light hover:bg-accent-500/10 rounded-lg transition-colors duration-300">
                    <span className="text-sm">🐙</span>
                  </a>
                  <a href={member.social.twitter} className="w-8 h-8 flex items-center justify-center bg-gray-light hover:bg-accent-500/10 rounded-lg transition-colors duration-300">
                    <span className="text-sm">🐦</span>
                  </a>
                </div>

                {/* Bottom Gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-accent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
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
