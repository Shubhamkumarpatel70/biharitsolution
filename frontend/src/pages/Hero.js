import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const Hero = () => {
  const textRef = useRef(null);
  const [typed, setTyped] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verbIndex, setVerbIndex] = useState(0);
  const [verbAnimKey, setVerbAnimKey] = useState(0);

  const phrases = [
    "Your idea into reality",
    "Modern Web Development",
    "E‑Commerce Solutions",
    "Custom Mobile Apps",
    "Support for Startups",
  ];

  const verbs = ["build", "develop", "testing", "launch"];
  const currentVerb = verbs[verbIndex % verbs.length];

  useEffect(() => {
    const targets = [textRef.current];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
          }
        });
      },
      { threshold: 0.2 },
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
      } else if (isDeleting && nextText === "") {
        setIsDeleting(false);
        setPhraseIndex((i) => (i + 1) % phrases.length);
        setVerbIndex((v) => (v + 1) % verbs.length);
      }
    }, speed);
    return () => clearTimeout(timer);
  }, [typed, isDeleting, phraseIndex, phrases]);

  // Re-trigger animation every time verb changes
  useEffect(() => {
    setVerbAnimKey((k) => k + 1);
  }, [verbIndex]);

  return (
    <section
      id="hero"
      className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gray-50 pt-20 sm:pt-24 pb-12 sm:pb-16"
      aria-labelledby="hero-title"
      aria-describedby="hero-subtitle"
    >
      {/* Very Subtle Background Pattern */}
      <div
        className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
        }}
      ></div>

      <div className="container relative z-10 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div
            ref={textRef}
            className="max-w-4xl mx-auto opacity-0 translate-y-8 transition-all duration-800 ease-out"
          >
            {/* Badge */}
            <div
              className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white border border-gray-200 text-primary-800 text-sm font-semibold tracking-wide shadow-sm"
              aria-label="Brand"
            >
              ASKC DIGITAL WEB
            </div>

            {/* Main Title */}
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.1] text-primary-900 tracking-tight"
              id="hero-title"
            >
              Welcome to
              <span className="text-primary-600 block mt-2">ASKC Digital Web</span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-lg md:text-xl text-text-muted mb-6 font-medium max-w-2xl mx-auto"
              id="hero-subtitle"
            >
              Web | Mobile | Cloud | Consultancy
            </p>

            {/* Typewriter Text */}
            <div className="mb-10 text-center" aria-live="polite">
              <div className="text-xl md:text-2xl text-text-light font-semibold">
                We{" "}
                <span
                  key={verbAnimKey}
                  className="inline-block text-primary-700 font-bold rotate-hor-center"
                >
                  {currentVerb}
                </span>
              </div>
              <div className="mt-2 text-2xl md:text-3xl text-primary-600 font-black tracking-tight min-h-[2.75rem] flex items-center justify-center">
                <span className="inline-flex items-center">
                  <span>{typed}</span>
                  <span
                    className="animate-pulse text-primary-400 font-light ml-1"
                    aria-hidden="true"
                  >
                    |
                  </span>
                </span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center w-full max-w-md sm:max-w-none mx-auto">
              <Link
                to="/services"
                className="btn btn-secondary px-6 sm:px-8 py-3.5 text-base rounded-xl w-full sm:w-auto sm:min-w-[180px] justify-center"
                aria-label="Explore our services"
              >
                Explore services
              </Link>
              <Link
                to="/contact"
                className="btn btn-primary px-6 sm:px-8 py-3.5 text-base rounded-xl w-full sm:w-auto sm:min-w-[180px] justify-center group"
                aria-label="Contact us"
              >
                Contact us
                <span
                  className="inline-block transition-transform duration-300 group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
