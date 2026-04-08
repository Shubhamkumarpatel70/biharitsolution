import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import axios from '../axios';
import { Icon } from '../components/icons';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
};

function careerShareUrl(job) {
  if (typeof window === 'undefined') return '/careers';
  return `${window.location.origin}/careers#career-${job._id}`;
}

function careerShareMessage(job) {
  const url = careerShareUrl(job);
  return `askc digital web opening positions for ${job.title}\n\n${url}`;
}

function Careers() {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyFor, setApplyFor] = useState(null);
  const [shareJob, setShareJob] = useState(null);
  const [shareNotice, setShareNotice] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const fetchCareers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/auth/careers');
      setCareers(res.data.careers || []);
    } catch (e) {
      setError('We could not load openings right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  useEffect(() => {
    if (!careers.length || typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash.startsWith('#career-')) return;
    const id = hash.slice(1);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [careers]);

  const copyToClipboard = async (text, successLabel) => {
    setShareNotice('');
    try {
      await navigator.clipboard.writeText(text);
      setShareNotice(successLabel);
      setTimeout(() => setShareNotice(''), 2500);
    } catch {
      setShareNotice('Copy not supported in this browser.');
      setTimeout(() => setShareNotice(''), 3000);
    }
  };

  const openNativeShare = async (job) => {
    const url = careerShareUrl(job);
    const text = `askc digital web opening positions for ${job.title}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'askc web — Careers', text, url });
        setShareJob(null);
      }
    } catch (e) {
      if (e.name !== 'AbortError') setShareNotice('Could not open share sheet.');
    }
  };

  const openApply = (career) => {
    setShareJob(null);
    setApplyFor(career);
    setForm(emptyForm);
    setResumeFile(null);
    setFormMessage({ type: '', text: '' });
  };

  const closeApply = () => {
    setApplyFor(null);
    setForm(emptyForm);
    setResumeFile(null);
    setFormMessage({ type: '', text: '' });
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyFor) return;
    if (!resumeFile) {
      setFormMessage({ type: 'err', text: 'Please attach your resume (PDF or Word).' });
      return;
    }
    setSubmitting(true);
    setFormMessage({ type: '', text: '' });
    try {
      const fd = new FormData();
      fd.append('careerId', applyFor._id);
      fd.append('name', form.name.trim());
      fd.append('email', form.email.trim());
      fd.append('phone', form.phone.trim());
      fd.append('city', form.city.trim());
      fd.append('state', form.state.trim());
      fd.append('resume', resumeFile);
      await axios.post('/api/auth/careers/apply', fd);
      setFormMessage({ type: 'ok', text: 'Thank you! Your application was submitted successfully.' });
      setForm(emptyForm);
      setResumeFile(null);
      setTimeout(closeApply, 2200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not submit. Please try again.';
      setFormMessage({ type: 'err', text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Join us"
        title="Careers"
        subtitle="Explore open roles and apply with your resume. We review every application carefully."
      />

      <section className="py-12 md:py-16 bg-white">
        <div className="container max-w-4xl mx-auto px-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p>Loading opportunities…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm">{error}</div>
          )}

          {!loading && !error && careers.length === 0 && (
            <div className="text-center py-16 px-4 rounded-2xl border border-gray-200 bg-gray-light/50">
              <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="briefcase" className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-bold text-primary-900 mb-2">No open positions right now</h2>
              <p className="text-text-muted max-w-md mx-auto mb-6">
                We are not hiring at the moment. Follow us or check back soon—we post new roles here first.
              </p>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors"
              >
                Get in touch
                <Icon name="arrowRight" className="w-4 h-4" />
              </Link>
            </div>
          )}

          {!loading && !error && careers.length > 0 && (
            <ul className="space-y-6">
              {careers.map((job) => (
                <li
                  key={job._id}
                  id={`career-${job._id}`}
                  className="rounded-2xl border border-gray-200 bg-white shadow-md hover:shadow-lg hover:border-accent-500/40 transition-all p-6 md:p-8 scroll-mt-24"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-2">{job.title}</h2>
                      <div className="flex flex-wrap gap-2 text-sm text-text-muted mb-4">
                        {job.location ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-text-main">
                            <Icon name="mapPin" className="w-3.5 h-3.5" />
                            {job.location}
                          </span>
                        ) : null}
                        {job.employmentType ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-800">
                            <Icon name="clock" className="w-3.5 h-3.5" />
                            {job.employmentType}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-text-muted text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setApplyFor(null);
                          setShareJob(job);
                          setShareNotice('');
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-primary-200 bg-white text-primary-800 font-bold text-sm hover:bg-primary-50 hover:border-primary-300 transition-colors"
                      >
                        <Icon name="share" className="w-4 h-4" />
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={() => openApply(job)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-500 text-primary-900 font-bold text-sm hover:bg-accent-400 transition-colors shadow-sm"
                      >
                        Apply now
                        <Icon name="arrowRight" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {shareJob && (
        <div
          className="fixed inset-0 z-[2250] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          onClick={(e) => e.target === e.currentTarget && setShareJob(null)}
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-gray-100">
              <div>
                <h2 id="share-modal-title" className="text-lg font-bold text-primary-900">
                  Share opening
                </h2>
                <p className="text-xs text-text-muted mt-1">Preview — edit after pasting if you need to.</p>
              </div>
              <button
                type="button"
                onClick={() => setShareJob(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-text-muted shrink-0"
                aria-label="Close"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message</p>
                <div className="rounded-xl border border-gray-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 whitespace-pre-wrap break-words">
                  {`askc digital web opening positions for ${shareJob.title}`}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Link</p>
                <a
                  href={careerShareUrl(shareJob)}
                  className="text-sm text-primary-600 hover:underline break-all block"
                >
                  {careerShareUrl(shareJob)}
                </a>
              </div>
              {shareNotice && (
                <p className="text-sm text-emerald-700 font-medium" role="status">
                  {shareNotice}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    onClick={() => openNativeShare(shareJob)}
                    className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700"
                  >
                    Share…
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(careerShareMessage(shareJob), 'Full message copied.')}
                    className="py-2.5 rounded-xl border border-gray-200 font-semibold text-sm text-slate-800 hover:bg-gray-50"
                  >
                    Copy message + link
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(careerShareUrl(shareJob), 'Link copied.')}
                    className="py-2.5 rounded-xl border border-gray-200 font-semibold text-sm text-slate-800 hover:bg-gray-50"
                  >
                    Copy link only
                  </button>
                </div>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(careerShareMessage(shareJob))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 font-semibold text-sm text-emerald-900 hover:bg-emerald-100 text-center inline-flex items-center justify-center"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {applyFor && (
        <div
          className="fixed inset-0 z-[2200] flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-modal-title"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[100dvh] sm:max-h-[min(90dvh,calc(100dvh-2rem))] flex flex-col border border-gray-200 overflow-hidden">
            <div className="shrink-0 bg-white border-b border-gray-100 px-4 sm:px-5 py-3 sm:py-4 flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h2 id="apply-modal-title" className="text-base sm:text-lg font-bold text-primary-900 leading-snug">
                  Apply for {applyFor.title}
                </h2>
                <p className="text-xs text-text-muted mt-1">PDF or Word, max 5 MB. All fields required.</p>
              </div>
              <button
                type="button"
                onClick={closeApply}
                className="shrink-0 p-2 rounded-lg hover:bg-gray-100 text-text-muted"
                aria-label="Close"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <form onSubmit={handleApplySubmit} className="p-4 sm:p-5 space-y-3 sm:space-y-4 pb-6">
              {formMessage.text && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    formMessage.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {formMessage.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile / phone</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                  <input
                    required
                    value={form.state}
                    onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Resume</label>
                <input
                  key={`resume-input-${applyFor._id}`}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setResumeFile(f);
                    if (formMessage.type === 'err') setFormMessage({ type: '', text: '' });
                  }}
                  className="w-full text-sm text-text-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/10 file:text-primary-800 file:font-semibold"
                />
                {resumeFile && (
                  <p className="mt-1.5 text-xs text-emerald-700 font-medium truncate" title={resumeFile.name}>
                    Selected: {resumeFile.name}
                  </p>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeApply}
                  className="w-full sm:flex-1 py-2.5 rounded-xl border border-gray-200 font-semibold text-text-main hover:bg-gray-50 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-60 text-sm sm:text-base"
                >
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Careers;
