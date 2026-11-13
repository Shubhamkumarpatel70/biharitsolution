import React, { useEffect, useState } from 'react';
import './PageSideNav.css';

export default function PageSideNav({ items = [], label = 'On this page' }) {
  const [activeId, setActiveId] = useState(items[0]?.id || '');

  useEffect(() => {
    if (!items.length) return undefined;
    const nodes = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (!nodes.length || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: '-18% 0px -62% 0px', threshold: [0, 0.15, 0.35, 0.6] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  const goTo = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    setActiveId(id);
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav className="askc-page-sidenav" aria-label={label}>
      <p className="askc-page-sidenav-title">{label}</p>
      <div className="askc-page-sidenav-links">
        {items.map((item, index) => (
          <a key={item.id} href={`#${item.id}`} onClick={(event) => goTo(event, item.id)}
            className={activeId === item.id ? 'is-active' : ''} aria-current={activeId === item.id ? 'location' : undefined}>
            <span className="askc-page-sidenav-index">{String(index + 1).padStart(2, '0')}</span>
            <span>{item.label}</span><span className="askc-page-sidenav-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
