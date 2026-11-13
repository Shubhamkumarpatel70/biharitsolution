import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from '../axios';
import { Icon } from '../components/icons';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get('/api/auth/projects')
      .then(response => {
        if (active) setProjects(Array.isArray(response.data?.projects) ? response.data.projects : []);
      })
      .catch(error => {
        console.error('Could not load latest projects:', error);
        if (active) setProjects([]);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <section className="py-16 md:py-24 bg-white" aria-labelledby="latest-projects-title">
      <div className="container">
        <div className="section-header">
          <h2 id="latest-projects-title" className="section-title">Latest Projects</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            A snapshot of our recent work—product builds, platforms, and experiences we ship end to end.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10" role="status" aria-label="Loading latest projects">
            <span className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-slate-600 animate-spin" />
          </div>
        ) : projects.length ? (
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-8 md:overflow-visible md:pb-0">
            {projects.map((project, index) => {
              const accent = /^#[0-9a-fA-F]{6}$/.test(project.color || '') ? project.color : '#64748b';
              const card = (
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg">
                  <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-50 md:h-48" style={{ background: project.image ? '#f8fafc' : `linear-gradient(135deg, ${accent}12, ${accent}28)` }}>
                    {project.image ? (
                      <img src={project.image} alt={project.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <Icon name={project.icon || 'briefcase'} className="h-16 w-16 md:h-20 md:w-20" style={{ color: accent }} />
                    )}
                    <span className="absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: accent }}>{project.category || 'Project'}</span>
                  </div>
                  <div className="p-5 md:p-6">
                    {project.highlight && <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>{project.highlight}</p>}
                    <h3 className="mb-2 text-lg font-bold leading-snug text-slate-900 md:text-xl">{project.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-600">{project.description}</p>
                    {!!project.technologies?.length && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map(technology => (
                          <span key={technology} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">{technology}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
              return (
                <div key={project._id || project.title} className="w-[min(100%,320px)] shrink-0 snap-center md:w-auto" style={{ animationDelay: `${index * 60}ms` }}>
                  {project.projectUrl ? <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2" aria-label={`View ${project.title}`}>{card}</a> : card}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm"><Icon name="folder" className="h-6 w-6" /></div>
            <p className="font-semibold text-slate-800">Projects coming soon</p>
            <p className="mt-1 text-sm text-slate-500">Our latest projects will appear here.</p>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:mt-14 md:px-8">
          <p className="max-w-xl text-sm text-slate-600 md:text-base">Planning something similar? We can scope architecture, timeline, and stack together—no obligation.</p>
          <Link to="/services" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-700">
            View our services <Icon name="arrowRight" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Projects;
