import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const textRef = useRef(null);
  const [typed, setTyped] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const phrases = [
    'Modern Web Development',
    'E‑Commerce Solutions',
    'Custom Mobile Apps',
    'Cloud & DevOps',
    'Support for Bihar Startups'
  ];

  useEffect(() => {
    const targets = [textRef.current];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
          }
        });
      },
      { threshold: 0.2 }
    );
    targets.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Typewriter effect
  useEffect(() => {
    const current = phrases[phraseIndex % phrases.length];
    const speed = isDeleting ? 50 : 100;
    const timer = setTimeout(() => {
      const nextText = isDeleting
        ? current.substring(0, typed.length - 1)
        : current.substring(0, typed.length + 1);
      setTyped(nextText);

      if (!isDeleting && nextText === current) {
        setTimeout(() => setIsDeleting(true), 900);
      } else if (isDeleting && nextText === '') {
        setIsDeleting(false);
        setPhraseIndex((i) => (i + 1) % phrases.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [typed, isDeleting, phraseIndex, phrases]);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 pt-24"
      aria-labelledby="hero-title"
      aria-describedby="hero-subtitle"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-primary opacity-95" aria-hidden="true"></div>
        
        {/* Abstract Shapes */}
        <div className="absolute inset-0 opacity-70" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute top-20 left-10 w-20 h-20 bg-accent-500/15 rounded-full animate-float"></div>
          <div className="absolute top-60 right-15 w-30 h-30 bg-accent-600/15 rounded-full animate-float delay-2000"></div>
          <div className="absolute bottom-30 left-20 w-15 h-15 bg-accent-500/15 rounded-full animate-float delay-4000"></div>
          <div className="absolute top-10 right-30 w-25 h-25 bg-accent-600/15 rounded-full animate-float delay-1000"></div>
        </div>
      </div>

      <div className="container relative z-10">
        <div className="flex items-center justify-center">
          <div 
            ref={textRef}
            className="text-center max-w-5xl mx-auto opacity-0 translate-y-8 transition-all duration-800 ease-out"
          >
            {/* Badge */}
            <div 
              className="inline-block px-4 py-2 mb-6 rounded-full bg-accent-500/20 border border-accent-500/50 text-primary-900 backdrop-blur-md text-sm font-bold shadow-gold"
              aria-label="Brand"
            >
              ASKC DIGITAL WEB
            </div>

            {/* Main Title */}
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 leading-tight"
              id="hero-title"
            >
              <span className="block text-white whitespace-nowrap">
                Welcome to
              </span>
              <span className="block mt-2">
                <span className="inline-block px-4 py-2 rounded-xl bg-accent-500/20 border border-accent-500/40 backdrop-blur-md shadow-gold">
                  <span className="text-gradient-gold font-black">
                    askc web
                  </span>
                </span>
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              className="text-lg md:text-xl text-white/90 mb-4 font-medium"
              id="hero-subtitle"
            >
              Web | Mobile | Cloud | Consultancy
            </p>

            {/* Typewriter Text */}
            <div 
              className="text-xl md:text-2xl text-white mb-8 min-h-[2rem] flex items-center justify-center gap-2"
              aria-live="polite"
            >
              <span className="text-white/80">We build</span>
              <span className="font-semibold text-accent-500">{typed}</span>
              <span className="animate-pulse text-accent-500" aria-hidden="true">|</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/services" 
                className="btn btn-secondary px-8 py-4 text-base font-semibold rounded-xl min-w-[200px]"
                aria-label="Explore our services"
              >
                Explore Services
              </Link>
              <Link 
                to="/contact" 
                className="btn btn-primary px-8 py-4 text-base font-semibold rounded-xl min-w-[200px] group"
                aria-label="Contact us"
              >
                Contact Us 
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
