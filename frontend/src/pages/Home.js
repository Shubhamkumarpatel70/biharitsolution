import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomeMaya.css';

const fallbackServices = [
  ['Website Design & Development', 'Fast, responsive websites built around your business goals.'],
  ['Web Applications', 'Custom workflows and dashboards that simplify daily operations.'],
  ['E-commerce Solutions', 'Practical online storefronts and commerce experiences.'],
  ['UI/UX Design', 'Clear, accessible interfaces that help people get things done.'],
  ['Business Management Systems', 'Purpose-built inventory, booking and management tools.'],
  ['Deployment & Support', 'Launch, maintenance, performance and technical support.'],
];

const processSteps = [
  ['01', 'Discover', 'We understand your business, audience and goals.'],
  ['02', 'Plan', 'We shape the right scope, timeline and solution.'],
  ['03', 'Create', 'We design, develop and test with care.'],
  ['04', 'Launch', 'We help you go live and move forward confidently.'],
];

const focusAreas = [
  ['01', 'Business websites', 'A professional online presence that builds trust and brings enquiries.'],
  ['02', 'Custom web apps', 'Useful dashboards and workflows made around the way your team works.'],
  ['03', 'E-commerce', 'A smoother way to present products and take your business online.'],
];

export default function Home() {
  const [homeContent, setHomeContent] = useState(null);
  const [cmsServices, setCmsServices] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/cms/public/page').then((response) => response.ok ? response.json() : { items: [] }),
      fetch('/api/cms/public/service').then((response) => response.ok ? response.json() : { items: [] }),
    ])
      .then(([pages, serviceResponse]) => {
        if (!active) return;
        setHomeContent((pages.items || []).find((item) => item.slug === 'home') || null);
        setCmsServices(serviceResponse.items || []);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = homeContent?.seo?.title || 'ASKC TECHNOLOGIES | We Build. You Grow.';
    const description = document.querySelector('meta[name="description"]');
    if (description && homeContent?.seo?.description) description.setAttribute('content', homeContent.seo.description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', 'https://askctechnologies.in/');
  }, [homeContent]);

  const visibleServices = cmsServices.length
    ? cmsServices.map((item) => [item.title, item.summary || item.body || 'Explore how this service can support your business.'])
    : fallbackServices;

  return (
    <main className="askc-maya-home">
      <section className="maya-hero">
        <div className="maya-wrap maya-hero-layout">
          <div className="maya-hero-copy">
            <span className="maya-kicker">DIGITAL SOLUTIONS FOR AMBITIOUS BUSINESSES</span>
            <h1>{homeContent?.title || <>We build digital experiences <span>that move your business forward.</span></>}</h1>
            <p>{homeContent?.summary || 'From standout websites to custom business applications, ASKC TECHNOLOGIES turns your ideas into useful, dependable digital products.'}</p>
            <div className="maya-hero-actions">
              <Link className="maya-btn maya-btn-blue" to="/contact">Start a project <span>↗</span></Link>
              <Link className="maya-btn maya-btn-white" to="/projects">Explore our work <span>→</span></Link>
            </div>
            <div className="maya-hand-note"><span>↳</span> Thoughtful design. Reliable technology. Real progress.</div>
          </div>
          <div className="maya-hero-visual" aria-label="Abstract digital workspace illustration">
            <div className="maya-sun-shape" />
            <div className="maya-window maya-window-back"><span /><span /><span /><div className="maya-window-lines" /></div>
            <div className="maya-device">
              <div className="maya-device-top"><i /><i /><i /></div>
              <div className="maya-device-screen">
                <div className="maya-screen-nav" />
                <div className="maya-screen-hero"><b>Ideas into<br />digital impact.</b><span /></div>
                <div className="maya-screen-cards"><i /><i /><i /></div>
              </div>
            </div>
            <div className="maya-float-note"><strong>Built around you</strong><small>Design · Development · Support</small></div>
            <div className="maya-spark maya-spark-one">✳</div><div className="maya-spark maya-spark-two">✦</div>
          </div>
        </div>
      </section>

      <section className="maya-work maya-section">
        <div className="maya-wrap maya-work-layout">
          <div className="maya-section-intro">
            <span className="maya-kicker maya-kicker-gold">WHAT WE CREATE</span>
            <h2>Digital work<br />with a purpose.</h2>
            <p>Every business is different. We create practical digital experiences that fit your goals and your customers.</p>
            <Link className="maya-text-link" to="/projects">Explore projects <span>→</span></Link>
          </div>
          <div className="maya-focus-grid">
            {focusAreas.map(([number, title, description], index) => (
              <Link to="/projects" className={`maya-focus-card maya-focus-card-${index + 1}`} key={number}>
                <span className="maya-focus-number">{number}</span>
                <div className="maya-project-art" aria-hidden="true">
                  <div className="maya-art-browser"><i /><i /><i /><b /><span /><span /><em /></div>
                </div>
                <div className="maya-focus-info"><div><h3>{title}</h3><p>{description}</p></div><span className="maya-round-arrow">↗</span></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="maya-services maya-section">
        <div className="maya-wrap maya-services-layout">
          <div className="maya-section-intro">
            <span className="maya-kicker">SERVICES & EXPERTISE</span>
            <h2>Simple solutions.<br /><em>Big impact.</em></h2>
            <p>Flexible digital services for businesses at every stage — from first launch to the next phase of growth.</p>
            <Link className="maya-text-link" to="/services">View all services <span>→</span></Link>
          </div>
          <div className="maya-service-grid">
            {visibleServices.slice(0, 6).map(([title, description], index) => (
              <Link to="/services" className="maya-service-card" key={title}>
                <span className="maya-service-icon">{['✳', '⌘', '◇', '✎', '▦', '↗'][index % 6]}</span>
                <span className="maya-service-index">0{index + 1}</span>
                <h3>{title}</h3><p>{description}</p><span className="maya-service-link">Discover service ↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="maya-process maya-section">
        <div className="maya-wrap">
          <div className="maya-centered-heading"><span className="maya-kicker maya-kicker-gold">A BETTER WAY TO BUILD</span><h2>Good work starts with a <em>clear process.</em></h2><p>You'll know what we're doing, why it matters and what comes next.</p></div>
          <div className="maya-process-grid">
            {processSteps.map(([number, title, description]) => <article className="maya-process-card" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="maya-why maya-section">
        <div className="maya-wrap maya-why-layout">
          <div className="maya-section-intro"><span className="maya-kicker maya-kicker-gold">WHY ASKC TECHNOLOGIES</span><h2>People-first thinking.<br /><em>Technology that works.</em></h2><p>We keep the process collaborative and the solution practical, so your digital investment keeps serving your business.</p></div>
          <div className="maya-why-points">
            <article><b>01</b><div><h3>Made for your goals</h3><p>We start with your needs, not a one-size-fits-all template.</p></div></article>
            <article><b>02</b><div><h3>Clear communication</h3><p>Understandable updates and clear expectations from start to finish.</p></div></article>
            <article><b>03</b><div><h3>Support beyond launch</h3><p>Practical handover and ongoing support options as your needs evolve.</p></div></article>
          </div>
        </div>
      </section>

      <section className="maya-contact-band">
        <div className="maya-wrap maya-contact-layout"><div><span className="maya-kicker">HAVE A PROJECT IN MIND?</span><h2>Let's create something<br /><em>meaningful together.</em></h2><p>Tell us what you're planning. We'll help you find the right next step.</p></div><Link className="maya-btn maya-btn-yellow" to="/contact">Let's talk about your project <span>↗</span></Link><div className="maya-contact-doodle">✳</div></div>
      </section>
    </main>
  );
}
