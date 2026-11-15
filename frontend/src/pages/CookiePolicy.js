import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';

const CookiePolicy = () => (
  <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
    <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <Link to="/" className="text-sm font-semibold text-sky-700 hover:underline">← Back to Home</Link>
      <div className="mt-7 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Icon name="cookie" className="h-7 w-7" /></span>
        <div><p className="text-xs font-bold uppercase tracking-widest text-sky-700">ASKC TECHNOLOGIES</p><h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1></div>
      </div>
      <p className="mt-3 text-sm text-slate-500">Last updated: 15 November 2026</p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-slate-600">
        <section><h2 className="text-lg font-bold text-slate-900">1. What cookies and similar storage do</h2><p>Cookies and browser storage help a website operate, remember choices and, where enabled, understand how visitors use the site.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">2. Categories</h2><ul className="mt-2 list-disc space-y-2 pl-5"><li><b>Essential:</b> support core website functions, security and account access. These are always active where required.</li><li><b>Preferences:</b> remember optional settings you choose.</li><li><b>Analytics:</b> help measure website usage and improve the experience. Used only if an analytics tool is configured and you consent.</li><li><b>Marketing:</b> support marketing measurement or related features. Used only if such tools are configured and you consent.</li></ul></section>
        <section><h2 className="text-lg font-bold text-slate-900">3. Your choices</h2><p>When the consent notice appears, you can accept all optional categories, reject optional categories or choose categories individually. You can change your choice later using <b>Cookie Preferences</b> in the website footer. Your choice is saved in this browser; clearing browser storage may reset it.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">4. Browser controls</h2><p>You can also block or delete cookies through your browser settings. Blocking essential storage may affect sign-in or other core features.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">5. Changes to this policy</h2><p>We may update this policy when our website functionality or applicable requirements change. The updated date above indicates the latest revision.</p></section>
        <section><h2 className="text-lg font-bold text-slate-900">6. Contact</h2><p>For questions about this policy or your cookie choices, contact <a className="font-semibold text-sky-700 hover:underline" href="mailto:askctechnologies@gmail.com">askctechnologies@gmail.com</a>.</p><p className="mt-1">ASKC TECHNOLOGIES, Bihar, India.</p></section>
      </div>
    </article>
  </main>
);
export default CookiePolicy;
