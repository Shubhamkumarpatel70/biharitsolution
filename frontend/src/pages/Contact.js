import React, { useState } from 'react';
import axios from '../axios';
import PageSideNav from '../components/PageSideNav';

const initial = { name: '', email: '', phone: '', company: '', serviceInterest: '', budget: '', message: '', consent: false, website: '' };

export default function Contact() {
  const [form, setForm] = useState(initial);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const update = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    if (!form.consent) { setResult('Please confirm that we may use your details to respond to this enquiry.'); return; }
    setSending(true); setResult('');
    try {
      await axios.post('/api/auth/contact', { ...form, subject: form.serviceInterest || 'Website enquiry' });
      setResult('Thank you. Your enquiry has been received.'); setForm(initial);
    } catch (error) {
      setResult(error.response?.data?.message || 'We could not submit your enquiry. Please try again.');
    } finally { setSending(false); }
  };
  const field = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100';
  const navItems = [{ id: 'contact-overview', label: 'Overview' }, { id: 'contact-details', label: 'Contact details' }, { id: 'contact-enquiry', label: 'Project enquiry' }];

  return (
    <div className="askc-contact-page min-h-screen bg-slate-50">
      <section id="contact-overview" className="bg-gradient-to-br from-blue-50 via-white to-slate-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <span className="text-xs font-bold tracking-[.18em] text-blue-600">LET’S TALK</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950 mt-4 max-w-3xl">Tell us what you want to build.</h1>
          <p className="text-slate-600 text-lg leading-8 mt-5 max-w-2xl">Share your requirements with ASKC TECHNOLOGIES. We’ll review your enquiry and respond using the contact details you provide.</p>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 grid lg:grid-cols-[230px_minmax(0,1fr)] gap-7 items-start">
        <div className="min-w-0">
          <PageSideNav items={navItems} label="Quick navigation" />
          <aside id="contact-details" className="bg-slate-950 text-white rounded-3xl p-7 md:p-8 h-fit scroll-mt-28">
            <span className="text-blue-300 text-xs font-bold tracking-widest">ASKC TECHNOLOGIES</span>
            <h2 className="text-2xl font-bold mt-4">We Build. You Grow.</h2>
            <p className="text-slate-300 leading-7 mt-3">For project discussions and business enquiries, send us a message using the form.</p>
            <div className="border-t border-slate-700 mt-8 pt-6"><p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Email</p><a className="text-white font-semibold break-all hover:text-blue-300 transition-colors" href="mailto:askctechnologies@gmail.com">askctechnologies@gmail.com</a></div>
            <div className="border-t border-slate-700 mt-6 pt-6"><p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Parent brand</p><p className="text-slate-200">ASKC Web — Digital Solutions, powered by ASKC TECHNOLOGIES.</p></div>
          </aside>
        </div>
        <form id="contact-enquiry" onSubmit={submit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-9 space-y-5 scroll-mt-28">
          <div><h2 className="text-2xl font-bold text-slate-950">Project enquiry</h2><p className="text-sm text-slate-500 mt-1">Fields marked with * are required.</p></div>
          {result && <div role="status" aria-live="polite" className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">{result}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm font-semibold text-slate-700">Full name *<input required maxLength="120" className={field + ' mt-2'} value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" /></label>
            <label className="text-sm font-semibold text-slate-700">Email address *<input required type="email" maxLength="254" className={field + ' mt-2'} value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@example.com" /></label>
            <label className="text-sm font-semibold text-slate-700">Phone (optional)<input type="tel" maxLength="30" className={field + ' mt-2'} value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="Phone number" /></label>
            <label className="text-sm font-semibold text-slate-700">Company (optional)<input maxLength="160" className={field + ' mt-2'} value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Business or organisation" /></label>
            <label className="text-sm font-semibold text-slate-700">Service interest<select className={field + ' mt-2'} value={form.serviceInterest} onChange={(e) => update('serviceInterest', e.target.value)}><option value="">Select a service</option><option>Website design & development</option><option>Web application / custom software</option><option>E-commerce</option><option>UI/UX design</option><option>Business management system</option><option>Deployment & maintenance</option><option>Other</option></select></label>
            <label className="text-sm font-semibold text-slate-700">Estimated budget (optional)<select className={field + ' mt-2'} value={form.budget} onChange={(e) => update('budget', e.target.value)}><option value="">Prefer not to say</option><option>Under ₹10,000</option><option>₹10,000–₹25,000</option><option>₹25,000–₹50,000</option><option>₹50,000–₹1,00,000</option><option>₹1,00,000+</option><option>To be discussed</option></select></label>
          </div>
          <label className="text-sm font-semibold text-slate-700 block">Tell us about your project *<textarea required minLength="10" maxLength="5000" rows="6" className={field + ' mt-2 resize-y'} value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="What would you like to build? What problem should it solve?" /></label>
          <div className="hidden" aria-hidden="true"><label>Leave this field empty<input tabIndex="-1" autoComplete="off" value={form.website} onChange={(e) => update('website', e.target.value)} /></label></div>
          <label className="flex items-start gap-3 text-xs text-slate-600 leading-5"><input required type="checkbox" checked={form.consent} onChange={(e) => update('consent', e.target.checked)} className="mt-1" />I agree that ASKC TECHNOLOGIES may use the information provided to respond to this enquiry.</label>
          <button disabled={sending} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 disabled:opacity-60">{sending ? 'Sending enquiry…' : 'Send enquiry ↗'}</button>
        </form>
      </section>
    </div>
  );
}
