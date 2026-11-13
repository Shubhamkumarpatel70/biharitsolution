import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const phrases = [
  "Websites that win customers",
  "Apps built around your vision",
  "Cloud solutions that scale",
  "Technology that moves business",
];

const Hero = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[phraseIndex];
    let delay = deleting ? 34 : 62;

    if (!deleting && typed === phrase) delay = 1450;
    if (deleting && typed === "") delay = 350;

    const timer = window.setTimeout(() => {
      if (!deleting && typed === phrase) {
        setDeleting(true);
      } else if (deleting && typed === "") {
        setDeleting(false);
        setPhraseIndex((current) => (current + 1) % phrases.length);
      } else {
        setTyped(
          deleting
            ? phrase.slice(0, Math.max(0, typed.length - 1))
            : phrase.slice(0, typed.length + 1),
        );
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typed, deleting, phraseIndex]);

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[780px] items-center overflow-hidden bg-[#0b1422] pb-16 pt-28 text-white sm:min-h-[820px] sm:pt-32 lg:min-h-[790px] lg:pb-20"
    >
      {/* Ambient light and technical grid */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -right-24 top-20 h-[440px] w-[440px] rounded-full bg-cyan-400/15 blur-[130px]" />
        <div className="absolute bottom-[-260px] left-1/3 h-[420px] w-[620px] rounded-full bg-indigo-500/15 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.22) 1px, transparent 1px)", backgroundSize: "54px 54px", maskImage: "linear-gradient(to bottom, black, transparent 92%)" }} />
      </div>

      <div className="container relative z-10 mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_.96fr] lg:gap-10">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.19em] text-cyan-100 shadow-lg shadow-cyan-950/20 backdrop-blur-md sm:text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Welcome to ASKC TECHNOLOGIES
            </div>

            <h1 id="hero-title" className="text-[2.65rem] font-black leading-[1.08] tracking-[-0.045em] sm:text-6xl lg:text-[4.35rem] xl:text-[4.8rem]">
              We develop
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text pb-2 text-transparent">
                what’s next.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg lg:mx-0">
              We turn ambitious ideas into reliable digital products — from powerful websites and mobile apps to cloud solutions and technology consultancy.
            </p>

            <div className="mt-7 flex min-h-9 items-center justify-center gap-2 text-base font-semibold text-white sm:text-lg lg:justify-start" aria-live="polite">
              <span className="text-slate-400">We build</span>
              <span className="min-w-0 bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                {typed}
                <span className="ml-0.5 animate-pulse text-cyan-300" aria-hidden="true">|</span>
              </span>
            </div>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/contact" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-cyan-950/30 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#0b1422]">
                Let’s talk about your project
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
              <Link to="/services" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70">
                Explore our services
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-400 lg:justify-start">
              <span className="inline-flex items-center gap-2"><span className="text-emerald-400">✓</span> Thoughtful solutions</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-400">✓</span> Built to grow</span>
              <span className="inline-flex items-center gap-2"><span className="text-emerald-400">✓</span> Human support</span>
            </div>
          </div>

          {/* Product-style visual: illustrative interface, not a fake client screenshot */}
          <div className="relative mx-auto w-full max-w-[560px]">
            <div aria-hidden="true" className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-violet-500/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/[0.07] p-3 shadow-[0_35px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-5">
              <div className="overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#101e30]">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">ASKC DIGITAL STUDIO</span>
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.9)]" />
                </div>

                <div className="grid gap-5 p-5 sm:p-7">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                      <span className="h-px w-6 bg-cyan-300" /> Digital experiences
                    </div>
                    <div className="max-w-sm text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                      Ideas become <span className="text-cyan-300">impact.</span>
                    </div>
                    <p className="mt-3 max-w-xs text-xs leading-6 text-slate-400 sm:text-sm">Design. Develop. Deploy. Grow with technology made for your goals.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-4">
                      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/15 text-lg text-cyan-200">⌘</div>
                      <div className="text-sm font-bold text-white">Web solutions</div>
                      <div className="mt-1 text-[11px] text-slate-400">Fast. Responsive. Ready.</div>
                    </div>
                    <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-400/15 to-blue-500/5 p-4">
                      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-300/15 text-lg text-violet-200">✳</div>
                      <div className="text-sm font-bold text-white">Mobile apps</div>
                      <div className="mt-1 text-[11px] text-slate-400">Useful. Intuitive. Smart.</div>
                    </div>
                    <div className="rounded-2xl border border-blue-300/15 bg-gradient-to-br from-blue-400/15 to-cyan-500/5 p-4">
                      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-300/15 text-lg text-blue-200">☁</div>
                      <div className="text-sm font-bold text-white">Cloud &amp; DevOps</div>
                      <div className="mt-1 text-[11px] text-slate-400">Reliable by design.</div>
                    </div>
                    <div className="rounded-2xl border border-amber-300/15 bg-gradient-to-br from-amber-300/15 to-orange-500/5 p-4">
                      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-300/15 text-lg text-amber-200">↗</div>
                      <div className="text-sm font-bold text-white">Consultancy</div>
                      <div className="mt-1 text-[11px] text-slate-400">A clearer way forward.</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold text-white">Your next chapter starts here.</div>
                      <div className="mt-1 text-[10px] text-slate-400">Let’s create something meaningful.</div>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300 text-lg font-bold text-slate-950">↗</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 top-[18%] hidden items-center gap-3 rounded-2xl border border-white/15 bg-[#17283b]/95 px-4 py-3 shadow-2xl backdrop-blur sm:flex lg:-left-10">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-lg text-emerald-300">✓</span>
              <div><div className="text-xs font-bold text-white">Built with purpose</div><div className="mt-0.5 text-[10px] text-slate-400">Focused on your goals</div></div>
            </div>
            <div className="absolute -bottom-5 right-2 hidden items-center gap-3 rounded-2xl border border-white/15 bg-[#17283b]/95 px-4 py-3 shadow-2xl backdrop-blur sm:flex lg:-right-7">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15 text-lg text-cyan-200">✦</span>
              <div><div className="text-xs font-bold text-white">Made to move you forward</div><div className="mt-0.5 text-[10px] text-slate-400">From concept to launch</div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
