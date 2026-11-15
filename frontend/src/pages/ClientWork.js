import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';
import './ClientWork.css';

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
          <div className="client-work-marquee" aria-label="Client logos moving from right to left">
            <div className="client-work-marquee__track">
              {[0, 1].map(copy => (
                <div className="client-work-marquee__group" key={copy} aria-hidden={copy === 1}>
                  {items.map(item => {
                    const logo = (
                      <div className="client-work-logo-card">
                        <div className="client-work-logo-card__image">
                          <img src={item.logo} alt={copy === 0 ? item.name : ''} loading="lazy" />
                        </div>
                        <span>{item.name}</span>
                      </div>
                    );
                    return (
                      <div className="client-work-marquee__item" key={`${copy}-${item._id}`}>
                        {copy === 0 && item.websiteUrl ? (
                          <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${item.name} website`}>
                            {logo}
                          </a>
                        ) : logo}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
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
