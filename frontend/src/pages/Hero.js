import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const phrases = [
  "your ideas into reality",
  "modern websites that perform",
  "e-commerce experiences",
  "mobile apps for growing teams",
  "digital solutions built to scale",
];

const verbs = ["design", "develop", "test", "launch"];

const Hero = () => {
  const textRef = useRef(null);
  const [typed, setTyped] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [verbIndex, setVerbIndex] = useState(0);

  useEffect(() => {
    const element = textRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add("hero-content-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    const isComplete = typed === phrase;
    const isEmpty = typed.length === 0;
    const delay = isDeleting ? 38 : isComplete ? 1500 : isEmpty ? 450 : 68;

    const timer = window.setTimeout(() => {
      if (isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && isEmpty) {
        setIsDeleting(false);
        setPhraseIndex((index) => (index + 1) % phrases.length);
        setVerbIndex((index) => (index + 1) % verbs.length);
        return;
      }

      setTyped(
        isDeleting
          ? phrase.slice(0, -1).slice(0, typed.length - 1)
          : phrase.slice(0, typed.length + 1),
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typed, isDeleting, phraseIndex]);

  return (
    <section
      id="hero"
      className="askc-hero relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-slate-50 pb-14 pt-24 sm:min-h-[90vh] sm:pb-20 sm:pt-28"
      aria-labelledby="hero-title"
      aria-describedby="hero-subtitle"
    >
      <style>{`
        .askc-hero { isolation: isolate; }
        .askc-hero::before, .askc-hero::after {
          content: ""; position: absolute; z-index: -1; border-radius: 9999px;
          pointer-events: none; filter: blur(2px);
        }
        .askc-hero::before {
          width: min(52vw, 560px); height: min(52vw, 560px); top: -20%; left: -12%;
          background: radial-gradient(circle, rgba(191,219,254,.48), rgba(219,234,254,0) 70%);
          animation: askc-orbit 16s ease-in-out infinite alternate;
        }
        .askc-hero::after {
          width: min(48vw, 500px); height: min(48vw, 500px); right: -12%; bottom: -24%;
          background: radial-gradient(circle, rgba(186,230,253,.5), rgba(224,242,254,0) 70%);
          animation: askc-orbit 19s ease-in-out infinite alternate-reverse;
        }
        .askc-hero-grid {
          background-image: radial-gradient(rgba(100,116,139,.18) .8px, transparent .8px);
          background-size: 24px 24px; mask-image: linear-gradient(to bottom, black, transparent 88%);
        }
        .askc-hero-content { opacity: 0; transform: translateY(24px); }
        .askc-hero-content.hero-content-visible { animation: askc-enter .85s cubic-bezier(.2,.75,.25,1) forwards; }
        .askc-hero-badge { animation: askc-badge 5s ease-in-out infinite; }
        .askc-hero-word { display: inline-block; animation: askc-word .55s cubic-bezier(.2,.8,.2,1) both; }
        .askc-hero-caret { animation: askc-caret 1s steps(2, start) infinite; }
        .askc-hero-primary { box-shadow: 0 10px 24px rgba(37,99,235,.18); transition: transform .25s ease, box-shadow .25s ease; }
        .askc-hero-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 30px rgba(37,99,235,.25); }
        .askc-hero-secondary { transition: transform .25s ease, background .25s ease; }
        .askc-hero-secondary:hover { transform: translateY(-3px); background: #eff6ff; }
        @keyframes askc-enter { to { opacity: 1; transform: translateY(0); } }
        @keyframes askc-word { from { opacity: 0; transform: translateY(12px) scale(.97); filter: blur(4px); } to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); } }
        @keyframes askc-caret { to { visibility: hidden; } }
        @keyframes askc-orbit { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(28px,-18px,0) scale(1.12); } }
        @keyframes askc-badge { 0%,100% { box-shadow: 0 4px 14px rgba(15,23,42,.04); } 50% { box-shadow: 0 7px 22px rgba(37,99,235,.12); } }
        @media (prefers-reduced-motion: reduce) {
          .askc-hero *, .askc-hero::before, .askc-hero::after { animation: none !important; transition: none !important; }
          .askc-hero-content { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="askc-hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" aria-hidden="true" />

      <div className="container relative z-10 px-4 sm:px-6">
        <div
          ref={textRef}
          className="askc-hero-content mx-auto flex max-w-5xl flex-col items-center text-center"
        >
          <div className="askc-hero-badge mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-xs font-bold tracking-[.16em] text-blue-800 shadow-sm sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-blue-600" aria-hidden="true" />
            ASKC TECHNOLOGIES
          </div>

          <h1
            id="hero-title"
            className="mb-6 text-4xl font-black leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Technology that
            <span className="mt-2 block text-blue-700">moves your business forward.</span>
          </h1>

          <p
            id="hero-subtitle"
            className="mb-7 max-w-2xl text-base font-medium leading-relaxed text-slate-600 sm:text-lg md:text-xl"
          >
            Web Development <span className="mx-1 text-blue-300">•</span>
            Mobile Apps <span className="mx-1 text-blue-300">•</span>
            Cloud Solutions <span className="mx-1 text-blue-300">•</span>
            IT Consultancy
          </p>

          <div className="mb-10 min-h-[5.5rem] text-center sm:min-h-[4.5rem]" aria-live="polite" aria-atomic="true">
            <p className="text-lg font-semibold text-slate-600 sm:text-xl">
              We <span key={verbIndex} className="askc-hero-word font-extrabold text-blue-700">{verbs[verbIndex]}</span>
            </p>
            <p className="mt-1 flex min-h-9 items-center justify-center text-xl font-bold tracking-tight text-slate-800 sm:text-2xl md:text-3xl">
              <span>{typed}</span>
              <span className="askc-hero-caret ml-1 font-light text-blue-500" aria-hidden="true">|</span>
            </p>
          </div>

          <div className="flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
            <Link
              to="/services"
              className="askc-hero-secondary btn btn-secondary w-full justify-center rounded-xl px-7 py-3.5 text-base font-semibold sm:min-w-[185px]"
              aria-label="Explore our services"
            >
              Explore services
            </Link>
            <Link
              to="/contact"
              className="askc-hero-primary btn btn-primary group w-full justify-center rounded-xl px-7 py-3.5 text-base font-semibold sm:min-w-[185px]"
              aria-label="Contact ASKC Technologies"
            >
              Let's talk
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </div>

          <p className="mt-8 text-xs font-medium tracking-wide text-slate-400 sm:text-sm">
            Thoughtful technology. Reliable delivery. Real business value.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
