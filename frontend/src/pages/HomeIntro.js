import React from 'react';

function HomeIntro() {
  const stats = [
    { value: "50+", label: "Projects", description: "Successful deliveries" },
    { value: "30+", label: "Clients", description: "Satisfied businesses" },
    { value: "3+", label: "Years", description: "Of excellence" }
  ];

  return (
    <section className="intro-section" aria-labelledby="intro-title">
      <div className="container">
        <div className="intro-grid">
          {/* Image Section */}
          <div className="intro-media">
            <div 
              className="intro-image" 
              role="img" 
              aria-label="askc web team working on digital projects"
            >
              {/* Optional: Add actual image tag or background image */}
              <div className="image-placeholder">
                <span className="sr-only">Digital technology illustration</span>
              </div>
            </div>
          </div>
          
          {/* Content Section */}
          <div className="intro-content">
            <header className="intro-header">
              <h2 id="intro-title" className="intro-title">
                About askc web
              </h2>
              <p className="intro-subtitle">
                Delivering excellence in digital innovation
              </p>
            </header>
            
            <p className="intro-text">
              We specialize in creating minimal, high-performing digital products 
              focused on clarity, speed, and measurable results. Our approach 
              combines cutting-edge technology with user-centered design to 
              drive your business forward.
            </p>
            
            {/* Stats Section */}
            <div className="intro-stats" role="region" aria-label="Company achievements">
              {stats.map((stat, index) => (
                <div key={index} className="intro-stat">
                  <span className="stat-value" aria-label={stat.value.replace('+', ' plus')}>
                    {stat.value}
                  </span>
                  <span className="stat-label">{stat.label}</span>
                  <span className="stat-description">{stat.description}</span>
                </div>
              ))}
            </div>
            
            {/* Call to Action */}
            <div className="intro-actions">
              <button className="btn btn-primary" aria-label="Learn more about our services">
                Learn More
              </button>
              <button className="btn btn-secondary" aria-label="Contact us for projects">
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeIntro;