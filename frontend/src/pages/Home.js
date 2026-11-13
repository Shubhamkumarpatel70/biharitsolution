import React from 'react';
import Hero from './Hero.js';
import Stats from './Stats.js';
import WhyChooseUs from './WhyChooseUs.js';
import ClientWork from './ClientWork.js';
import Projects from './Projects.js';
import CTA from './CTA.js';

function Home() {
  return (
    <div className="min-h-screen bg-gray-light text-text-main overflow-x-hidden">
      <Hero />
      <Stats />
      <WhyChooseUs />
      <ClientWork />
      <Projects />
      <CTA />
    </div>
  );
}

export default Home;
