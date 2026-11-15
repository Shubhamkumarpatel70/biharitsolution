import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "askc_cookie_consent_v1";
const defaultChoices = { essential: true, preferences: false, analytics: false, marketing: false };

export function readCookieConsent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); }
  catch { return null; }
}

export default function CookieConsent() {
  const [consent, setConsent] = useState(null);
  const [visible, setVisible] = useState(false);
  const [settings, setSettings] = useState(false);
  const [choices, setChoices] = useState(defaultChoices);

  useEffect(() => {
    const saved = readCookieConsent();
    if (saved && saved.version === 1) setConsent(saved);
    else setVisible(true);
    const reopen = () => { setChoices(readCookieConsent()?.categories || defaultChoices); setSettings(true); setVisible(true); };
    window.addEventListener("askc-open-cookie-settings", reopen);
    return () => window.removeEventListener("askc-open-cookie-settings", reopen);
  }, []);

  const save = next => {
    const record = { version: 1, categories: { ...defaultChoices, ...next, essential: true }, decision: next.analytics || next.preferences || next.marketing ? "custom" : "necessary_only", updatedAt: new Date().toISOString() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch (error) { console.warn("Cookie preferences could not be saved", error); }
    setConsent(record); setVisible(false); setSettings(false);
    window.dispatchEvent(new CustomEvent("askc-cookie-consent-updated", { detail: record }));
  };
  if (!visible) return null;

  return <div className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-5" role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title">
    <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/20 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-wider text-sky-700">ASKC TECHNOLOGIES</p><h2 id="cookie-consent-title" className="mt-1 text-lg font-bold text-slate-900">Your privacy choices</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">We use essential storage to make this website work. Optional preferences, analytics and marketing storage will only be used if you allow them. You can change your choice at any time.</p><Link to="/cookies" className="mt-2 inline-block text-sm font-semibold text-sky-700 underline">Read our Cookie Policy</Link></div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={() => save(defaultChoices)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reject optional</button>
          <button type="button" onClick={() => { setChoices(consent?.categories || defaultChoices); setSettings(v => !v); }} className="rounded-xl border border-sky-200 px-4 py-2.5 text-sm font-semibold text-sky-800 hover:bg-sky-50">Preferences</button>
          <button type="button" onClick={() => save({ essential: true, preferences: true, analytics: true, marketing: true })} className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800">Accept all</button>
        </div>
      </div>
      {settings && <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
        {[["essential","Essential","Required for security, navigation and core account functions.",true],["preferences","Preferences","Remember optional choices such as display preferences.",false],["analytics","Analytics","Help us understand site usage and improve performance.",false],["marketing","Marketing","Allow marketing-related storage and measurement.",false]].map(([key,label,description,locked]) => <label key={key} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3"><input type="checkbox" className="mt-1 h-4 w-4 accent-sky-700" checked={Boolean(choices[key])} disabled={locked} onChange={e => setChoices(current => ({ ...current, [key]: e.target.checked }))}/><span><b className="block text-sm text-slate-900">{label}{locked ? " (always active)" : ""}</b><span className="mt-1 block text-xs text-slate-500">{description}</span></span></label>)}
        <div className="sm:col-span-2 flex justify-end"><button type="button" onClick={() => save(choices)} className="rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white">Save my choices</button></div>
      </div>}
    </div>
  </div>;
}
