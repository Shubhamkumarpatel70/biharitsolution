import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axios';
import PageHero from '../components/PageHero';
import { Icon } from '../components/icons';

const values = [
  { title: 'Innovation', desc: 'We stay updated with the latest trends and best practices', icon: 'lightbulb' },
  { title: 'Collaboration', desc: 'Working together to achieve the best results for our clients', icon: 'users' },
  { title: 'Excellence', desc: 'Committed to delivering high-quality solutions every time', icon: 'star' },
  { title: 'Growth', desc: 'Continuously learning and improving our skills and processes', icon: 'trending' }
];

const perks = [
  { title: 'Flexible Work Environment', desc: 'Work from anywhere with our remote-friendly culture', icon: 'home' },
  { title: 'Professional Development', desc: 'Continuous learning opportunities and skill development', icon: 'book' },
  { title: 'Competitive Benefits', desc: 'Health insurance, paid time off, and performance bonuses', icon: 'currency' },
  { title: 'Team Events', desc: 'Regular team building activities and social events', icon: 'party' }
];

const getInitials = (name = '') =>
  name.trim().split(/\\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'A';

function Team() {
  const [isVisible, setIsVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/team');
      const members = response.data.teamMembers || [];
      setTeamMembers([...members].sort((a, b) => (a.order || 0) - (b.order || 0)));
      setError(null);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] pt-20 text-slate-900">
      <PageHero
        eyebrow="The people behind the work"
        title="Good people. Thoughtful technology. Real progress."
        subtitle="Meet the people bringing ideas to life through creativity, collaboration and dependable engineering."
      />

      <section className="relative overflow-hidden bg-white py-16 md:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">
              <span className="h-2 w-2 rounded-full bg-indigo-500" /> Meet the people
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl md:text-5xl">Our Talented Team</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Meet the professionals who make your projects successful. Different skills, one shared focus: creating work that makes a difference.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map(item => (
                <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="h-28 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="mx-auto -mt-12 h-24 w-24 animate-pulse rounded-3xl border-4 border-white bg-slate-200" />
                  <div className="mx-auto mt-5 h-5 w-36 animate-pulse rounded bg-slate-100" />
                  <div className="mx-auto mt-3 h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 h-16 animate-pulse rounded-xl bg-slate-50" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mx-auto max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm"><Icon name="warning" className="h-7 w-7" /></div>
              <h3 className="text-xl font-bold text-slate-900">We couldn’t load the team</h3>
              <p className="mt-2 text-sm text-slate-600">{error}. Please try again.</p>
              <button onClick={fetchTeamMembers} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 font-semibold text-white transition hover:bg-slate-700">Try again</button>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="mx-auto max-w-lg rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm"><Icon name="users" className="h-8 w-8" /></div>
              <h3 className="text-xl font-bold text-slate-900">Our team is taking shape</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Team profiles will appear here as they are added.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member, index) => (
                <article
                  key={member._id || member.name || index}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-2 hover:border-indigo-200 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
                  style={{ transitionDelay: `${index * 70}ms` }}
                >
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#0b1422] via-[#172b48] to-indigo-700">
                    <div aria-hidden="true" className="absolute -right-8 -top-20 h-48 w-48 rounded-full border border-white/10" />
                    <div aria-hidden="true" className="absolute -right-1 -top-12 h-36 w-36 rounded-full border border-white/10" />
                    <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-100 backdrop-blur">ASKC team</span>
                    <span className="absolute bottom-4 right-5 text-xs font-semibold tracking-[0.15em] text-white/50">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="relative px-6 pb-7">
                    <div className="-mt-12 flex items-end justify-between">
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-cyan-100 to-indigo-100 text-2xl font-black text-indigo-700 shadow-lg shadow-slate-900/10">
                        {member.profileImage ? (
                          <img src={member.profileImage} alt={member.name || 'Team member'} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <span>{getInitials(member.name)}</span>
                        )}
                      </div>
                      <span className="mb-1 max-w-[55%] truncate rounded-full border border-indigo-100 bg-indigo-50 px-3 py-2 text-right text-[11px] font-bold text-indigo-700" title={member.position || member.role || 'Team member'}>
                        {member.position || member.role || 'Team member'}
                      </span>
                    </div>
                    <h3 className="mt-5 break-words text-xl font-extrabold tracking-tight text-slate-950 transition-colors group-hover:text-indigo-700">{member.name || 'ASKC Team Member'}</h3>
                    <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300 group-hover:w-20" />
                    <p className="mt-4 min-h-[72px] text-sm leading-7 text-slate-600">{member.bio || 'A valued member of the ASKC TECHNOLOGIES team.'}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs font-semibold text-slate-400">People behind progress</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition group-hover:bg-indigo-600 group-hover:text-white" aria-hidden="true">✦</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#f5f7fb] py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">What guides us</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">The values behind our work</h2>
            <p className="mt-4 leading-7 text-slate-600">The principles that guide our work and define our success.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div key={value.title} className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`} style={{ transitionDelay: `${index * 70}ms` }}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Icon name={value.icon} className="h-6 w-6" /></div>
                <h3 className="text-lg font-extrabold text-slate-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Grow with us</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Join our team</h2>
            <p className="mt-4 leading-7 text-slate-600">We’re always looking for talented individuals to join our growing team.</p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2">
            {perks.map(perk => (
              <div key={perk.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-cyan-200 hover:bg-white hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-cyan-700 shadow-sm ring-1 ring-slate-200"><Icon name={perk.icon} className="h-6 w-6" /></div>
                <div><h3 className="font-bold text-slate-900">{perk.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{perk.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contact" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 font-bold text-white transition hover:-translate-y-0.5 hover:bg-indigo-700">Apply now <span className="ml-2" aria-hidden="true">→</span></Link>
            <Link to="/about" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700">Learn more about us</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#0b1422] py-16 text-white md:py-20">
        <div className="container mx-auto max-w-5xl px-4 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Let’s build together</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Ready to work with our team?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300">Let’s discuss your project and see how our team can help bring your vision to life.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/contact" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-7 font-bold text-slate-950 transition hover:-translate-y-1">Start your project <span className="ml-2" aria-hidden="true">→</span></Link>
            <Link to="/services" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-7 font-semibold text-white transition hover:border-cyan-300/50 hover:bg-white/10">View our services</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Team;
