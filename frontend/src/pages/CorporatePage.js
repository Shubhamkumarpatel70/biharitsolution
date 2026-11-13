import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageSideNav from '../components/PageSideNav';

const pages = {
  about: { eyebrow: 'WHO WE ARE', title: 'A technology partner focused on practical outcomes.', intro: 'ASKC TECHNOLOGIES helps businesses plan, build and improve their digital products and operations.', sections: [['Our approach', 'We begin by understanding the problem, users and business context. We then agree on scope, build in clear stages and validate the result.'], ['Our promise', 'Clear communication, thoughtful engineering and solutions designed around real requirements.'], ['Our brand', 'ASKC Web is the digital-solutions identity powered by ASKC TECHNOLOGIES. ASKC TECHNOLOGIES is the parent technology company.']] },
  services: { eyebrow: 'OUR SERVICES', title: 'Digital services built around your business.', intro: 'Choose the support you need, from a new website to a custom application or ongoing technical care.', sections: [['Website design & development', 'Responsive business websites with clear structure, useful content and conversion-focused journeys.'], ['Web applications & custom software', 'Role-based portals, dashboards and workflow tools tailored to your operations.'], ['E-commerce solutions', 'Online storefronts, product catalogues and practical commerce workflows.'], ['UI/UX design', 'Information architecture, interface design and usability improvements.'], ['Business systems', 'Inventory, booking, library and management applications based on agreed requirements.'], ['Deployment & maintenance', 'Production setup, performance improvements, updates and technical support.']] },
  products: { eyebrow: 'OUR PRODUCTS', title: 'Purpose-built digital products.', intro: 'Explore solutions developed by ASKC TECHNOLOGIES. Product availability and status will be published here as they are verified.', sections: [['Product catalogue', 'Product details, screenshots, features and demo enquiries will be managed through the website CMS.']] },
  portfolio: { eyebrow: 'SELECTED WORK', title: 'Work that demonstrates what is possible.', intro: 'We share project stories only when the work and details are approved for publication.', sections: [['Case studies', 'Approved case studies will describe the challenge, solution, technologies and verified outcomes.']] },
  industries: { eyebrow: 'WHO WE HELP', title: 'Technology for different ways of working.', intro: 'We design solutions around each organisation’s workflow rather than forcing every business into the same template.', sections: [['Retail & commerce', 'Storefronts, inventory and order workflows.'], ['Education & information', 'Websites, portals and library-style management tools.'], ['Service businesses', 'Enquiry, booking and customer-management workflows.'], ['Growing organisations', 'Internal dashboards and custom operational software.']] },
  blog: { eyebrow: 'INSIGHTS', title: 'Ideas, guides and product updates.', intro: 'Articles and updates will appear here as they are prepared and published by the ASKC team.', sections: [['Coming soon', 'The insights library is being prepared. Please check back for practical technology articles and company updates.']] }
};
const contentTypeMap = { about: 'page', services: 'service', products: 'product', portfolio: 'portfolio', industries: 'industry', blog: 'article' };

export default function CorporatePage() {
  const { pathname } = useLocation();
  const key = pathname.split('/')[1] || 'about';
  const slug = pathname.split('/')[2] || '';
  const page = pages[key] || pages.about;
  const [records, setRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const type = contentTypeMap[key];
    if (!type) { setLoading(false); return undefined; }
    setLoading(true);
    fetch('/api/cms/public/' + type)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load published content')))
      .then((data) => { if (active) { const items = data.items || []; setRecords(type === 'page' ? items.filter((item) => item.slug === key) : items); } })
      .catch(() => { if (active) setRecords([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key]);

  React.useEffect(() => {
    const activeRecord = slug ? records.find((item) => item.slug === slug) : records[0];
    document.title = activeRecord?.seo?.title || page.title + ' | ASKC TECHNOLOGIES';
    const description = activeRecord?.seo?.description || page.intro;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', 'https://askctechnologies.in' + pathname);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', document.title);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', 'https://askctechnologies.in' + pathname);
  }, [records, page.title, page.intro, pathname, slug]);

  const visibleRecords = slug ? records.filter((item) => item.slug === slug) : records;
  const heading = slug && visibleRecords[0] ? visibleRecords[0].title : page.title;
  const intro = slug && visibleRecords[0] ? (visibleRecords[0].summary || '') : page.intro;
  const cards = visibleRecords.length ? visibleRecords : (!slug ? page.sections.map(([title, summary]) => ({ title, summary, body: '' })) : []);
  const navItems = [{ id: 'page-overview', label: 'Overview' }, ...cards.map((item, index) => ({ id: 'page-section-' + index, label: item.title })), { id: 'page-contact', label: 'Discuss a project' }];

  return (
    <div className="askc-site askc-corporate-detail">
      <section id="page-overview" className="askc-page-hero">
        <div className="askc-container">
          <span className="askc-eyebrow">{page.eyebrow}</span>
          <h1>{heading}</h1><p>{intro}</p>
          <Link className="askc-btn askc-btn-primary" to="/contact">Talk to our team ↗</Link>
        </div>
      </section>
      <section className="askc-section">
        <div className="askc-container askc-corporate-layout">
          <PageSideNav items={navItems} label="Explore this page" />
          <div className="askc-side-content">
            {loading ? <p>Loading published content…</p> : slug && cards.length === 0 ? <p>This item is not available or has not been published.</p> : (
              <div className="askc-content-grid askc-content-grid-sidebar">
                {cards.map((item, index) => (
                  <article id={'page-section-' + index} className="askc-content-card" key={item._id || item.title}>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.imageAlt || item.title} loading="lazy" className="w-full aspect-[16/9] object-cover rounded-xl mb-4" />}
                    <span className="askc-card-number">0{index + 1}</span>
                    {item.category && <span className="block text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">{item.category}</span>}
                    <h2>{item.title}</h2><p>{item.summary || item.body}</p>
                    {item.body && item.summary && item.body !== item.summary && <p className="mt-3 whitespace-pre-line">{item.body}</p>}
                    {item.tags?.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{item.tags.map((tag) => <span key={tag} className="text-xs rounded-full bg-slate-100 px-3 py-1 text-slate-600">{tag}</span>)}</div>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <section id="page-contact" className="askc-cta">
        <div className="askc-container askc-cta-inner">
          <div><span className="askc-eyebrow">NEXT STEP</span><h2>Have a requirement to discuss?</h2><p>Share a little about your project and goals.</p></div>
          <Link className="askc-btn askc-btn-white" to="/contact">Contact ASKC ↗</Link>
        </div>
      </section>
    </div>
  );
}
