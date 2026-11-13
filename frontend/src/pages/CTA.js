import React from 'react';
import { Link } from 'react-router-dom';

function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#f4f5f7] py-16 sm:py-20 lg:py-28" aria-labelledby="home-cta-title">
      <div className="container relative z-10">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#111820] px-6 py-12 text-white shadow-2xl shadow-slate-900/15 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
            <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
            <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
          </div>

          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-14">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-accent-300">
                <span className="h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_12px_rgba(250,204,21,.8)]" />
                Let’s build what’s next
              </div>
              <h2 id="home-cta-title" className="mb-5 max-w-2xl text-3xl font-black leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your next big idea deserves a <span className="text-accent-400">great digital experience.</span>
              </h2>
              <p className="mb-0 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                Tell us what you’re planning. We’ll help shape the right solution, map out the next steps, and turn your goals into something real.
              </p>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2"><span className="text-accent-400">✓</span> Clear project discussion</span>
                <span className="inline-flex items-center gap-2"><span className="text-accent-400">✓</span> Solutions around your goals</span>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6 lg:w-[280px]">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Have a project in mind?</p>
              <p className="mb-6 text-xl font-bold leading-snug text-white">Let’s talk about making it happen.</p>
              <div className="flex flex-col gap-3">
                <Link to="/contact" className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-300">
                  Start a conversation <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link to="/plans" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 py-3 font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/10">
                  Explore our plans
                </Link>
              </div>
              <p className="mb-0 mt-4 text-center text-xs text-slate-400">No pressure. Just a useful first conversation.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
