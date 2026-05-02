import React from 'react';
import { Icon } from '../components/icons';

const agreements = [
  { id: 'index', name: 'Agreement Index', file: 'index.html', icon: 'document' },
  { id: 'nda', name: 'Non-Disclosure Agreement (NDA)', file: 'nda.html', icon: 'shield' },
  { id: 'quotation', name: 'Service Quotation', file: 'quotation.html', icon: 'currency' },
  { id: 'invoice', name: 'Tax Invoice Template', file: 'invoice.html', icon: 'clipboard' },
  { id: 'welcome', name: 'Client Welcome Letter', file: 'welcome.html', icon: 'mail' },
  { id: 'handover', name: 'Project Handover Document', file: 'handover.html', icon: 'check' },
  { id: 'change_request', name: 'Change Request Form', file: 'change_request.html', icon: 'refresh' },
  { id: 'questionnaire', name: 'Client Questionnaire', file: 'questionnaire.html', icon: 'help' },
  { id: 'id_card', name: 'ID Card Template (Legacy)', file: 'id_card.html', icon: 'creditCard' },
  { id: 'dashboard', name: 'Agreement Dashboard', file: 'dashboard.html', icon: 'home' },
];

const AdminAgreements = () => {
  const openAgreement = (file) => {
    // Assuming we'll serve these from a public path or backend
    window.open(`/agreements/${file}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 lg:pb-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 md:p-8 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" aria-hidden />
        <div className="relative z-10">
          <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-2">Legal & Compliance</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Agreements & Documents</h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
            Manage and view official company agreements, quotations, and handover documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agreements.map((doc) => (
          <div
            key={doc.id}
            className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-indigo-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Icon name={doc.icon || 'document'} className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 px-2 py-1 rounded-md">
                HTML Template
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
              {doc.name}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Official template for {doc.name.toLowerCase()}. Ready for client distribution.
            </p>
            
            <div className="flex items-center gap-3 mt-auto">
              <button
                onClick={() => openAgreement(doc.file)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Icon name="eye" className="w-4 h-4" />
                View
              </button>
              <button
                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-100"
                title="Download Template"
              >
                <Icon name="download" className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.15),transparent)] pointer-events-none" />
        <Icon name="help" className="w-12 h-12 text-indigo-400 mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-xl font-bold text-white mb-2">Need a custom agreement?</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          Contact the legal department or use the document generator to create a new custom contract for special project requirements.
        </p>
        <button className="px-6 py-2.5 bg-white text-slate-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
          Contact Legal Team
        </button>
      </div>
    </div>
  );
};

export default AdminAgreements;
