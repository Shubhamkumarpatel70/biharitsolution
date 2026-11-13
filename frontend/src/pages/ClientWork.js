import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

function ClientWork() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get('/api/auth/client-work')
      .then(response => {
        if (active) {
          const list = Array.isArray(response.data?.clientWork) ? response.data.clientWork : [];
          setItems(list);
        }
      })
      .catch(error => {
        console.error('Could not load client work:', error);
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white" aria-labelledby="client-work-title">
      <div className="container">
        <div className="section-header">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-3">Trusted partnerships</p>
          <h2 id="client-work-title" className="section-title">Our Client Work</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            A look at the businesses and websites we have had the opportunity to work with.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" role="status" aria-label="Loading client work">
            <span className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {items.map(item => {
              const logo = (
                <div className="group flex h-36 md:h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md">
                  <div className="flex min-h-0 flex-1 w-full items-center justify-center">
                    <img src={item.logo} alt={item.name} loading="lazy" className="max-h-20 max-w-full object-contain transition-transform duration-200 group-hover:scale-105" />
                  </div>
                  <span className="w-full truncate text-center text-sm font-semibold text-slate-700">{item.name}</span>
                </div>
              );
              return (
                <div key={item._id} className="min-w-0">
                  {item.websiteUrl ? (
                    <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${item.name} website`} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2">
                      {logo}
                      <span className="sr-only"><Icon name="externalLink" /></span>
                    </a>
                  ) : logo}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
              <Icon name="briefcase" className="h-6 w-6" />
            </div>
            <p className="font-semibold text-slate-800">Client work coming soon</p>
            <p className="mt-1 text-sm text-slate-500">Our latest client websites and projects will appear here.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ClientWork;
