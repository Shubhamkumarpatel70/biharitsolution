import React from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const miniServices = [
  { title: 'Web Design', icon: 'palette', color: '#38bdf8', category: 'Design', description: 'Clean, memorable interfaces shaped around your brand and customers.' },
  { title: 'Web Development', icon: 'code', color: '#818cf8', category: 'Development', description: 'Fast, responsive websites and full-stack applications built to scale.' },
  { title: 'E-commerce', icon: 'cart', color: '#c084fc', category: 'Commerce', description: 'Online stores with smooth shopping, secure checkout and easy management.' },
  { title: 'UI/UX', icon: 'puzzle', color: '#f472b6', category: 'Design', description: 'Thoughtful user journeys that make every interaction feel effortless.' },
  { title: 'Maintenance', icon: 'wrench', color: '#34d399', category: 'Support', description: 'Ongoing updates, monitoring and improvements to keep things running.' },
  { title: 'SEO/Marketing', icon: 'rocket', color: '#fb7185', category: 'Growth', description: 'Technical foundations that help the right people discover your business.' },
  { title: 'Speed Optimization', icon: 'bolt', color: '#fbbf24', category: 'Performance', description: 'Performance improvements for quicker loads and better experiences.' },
  { title: 'Landing Page', icon: 'document', color: '#2dd4bf', category: 'Web', description: 'Focused landing pages designed to turn visitors into enquiries.' },
  { title: 'Portfolio Site', icon: 'folder', color: '#22d3ee', category: 'Web', description: 'A polished online presence to showcase your work and expertise.' },
  { title: 'Blog Setup', icon: 'pen', color: '#fb923c', category: 'Content', description: 'Publishing experiences that make sharing ideas simple and organised.' },
  { title: 'CMS Development', icon: 'blocks', color: '#a78bfa', category: 'Development', description: 'Flexible content systems that put everyday updates in your hands.' },
  { title: 'Domain & Hosting', icon: 'globe', color: '#38bdf8', category: 'Infrastructure', description: 'Help with domain, hosting, deployment and essential setup.' },
  { title: 'Logo Design', icon: 'brush', color: '#fb7185', category: 'Branding', description: 'Distinctive visual marks that give your business a recognisable identity.' },
  { title: 'Brand Kit', icon: 'target', color: '#facc15', category: 'Branding', description: 'Consistent colours, typography and brand assets for every touchpoint.' },
  { title: 'Analytics Setup', icon: 'chart', color: '#2dd4bf', category: 'Insights', description: 'Useful measurement foundations to understand traffic and activity.' },
  { title: 'Chatbot Integration', icon: 'robot', color: '#22d3ee', category: 'Automation', description: 'Helpful chat experiences that support visitors and answer common queries.' },
  { title: 'Payment Integration', icon: 'creditCard', color: '#a78bfa', category: 'Payments', description: 'Payment gateway integration with a smooth, reliable checkout flow.' },
  { title: 'Multi-language', icon: 'globe', color: '#60a5fa', category: 'Accessibility', description: 'Reach more customers with multilingual content experiences.' },
  { title: 'PWA Setup', icon: 'smartphone', color: '#a3e635', category: 'Mobile', description: 'App-like web experiences with installability on supported devices.' },
  { title: 'Site Migration', icon: 'truck', color: '#fb7185', category: 'Infrastructure', description: 'Careful website moves with attention to content and continuity.' },
  { title: 'Bug Fixes', icon: 'wrench', color: '#2dd4bf', category: 'Support', description: 'Diagnose issues and make targeted fixes to restore confidence.' }
];

function Services() {
  return (
    <div className="min-h-screen bg-[#f5f7fb] pt-20 text-slate-900">
      <PageHero
        eyebrow="What we do"
        title="Technology that moves your business forward"
        subtitle="From a strong first impression to a complete digital platform, we bring the right thinking and technology to every stage."
      />

      <section className="relative overflow-hidden bg-white py-16 md:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-20 h-96 w-96 rounded-full bg-sky-100/70 blur-3xl" />
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Our services
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
              Comprehensive web development solutions
              <span className="mt-2 block bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">tailored to your business needs.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Practical digital services, thoughtfully delivered. Choose the support you need today and build a stronger foundation for tomorrow.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">{miniServices.length}+ service capabilities</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Responsive by design</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Built around your goals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {miniServices.map((item, idx) => (
              <article
                key={item.title}
                className="group relative flex min-h-[250px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition duration-300 hover:-translate-y-1.5 hover:border-sky-200 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)]"
                style={{ transitionDelay: `${Math.min(idx % 4, 3) * 25}ms` }}
              >
                <div aria-hidden="true" className="absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition duration-500 group-hover:opacity-100" style={{ background: item.color + '35' }} />
                <div className="relative mb-6 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border transition duration-300 group-hover:scale-105" style={{ backgroundColor: item.color + '14', borderColor: item.color + '30', color: item.color }}>
                    <Icon name={item.icon} className="h-7 w-7" />
                  </div>
                  <span className="rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-slate-500 ring-1 ring-slate-200/80">{item.category}</span>
                </div>
                <h3 className="relative text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-sky-700">{item.title}</h3>
                <p className="relative mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
                <div className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-700">Explore this service</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1422] py-16 text-white md:py-20">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 text-center sm:px-6 md:flex-row md:text-left">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Have a project in mind?</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Let’s find the right solution for you.</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">Tell us what you want to achieve. We’ll help you plan the next step.</p>
          </div>
          <Link to="/contact" className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:-translate-y-1 hover:shadow-cyan-500/20">
            Discuss your project <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Services;
