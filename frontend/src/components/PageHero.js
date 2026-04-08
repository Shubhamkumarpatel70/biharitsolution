import React from 'react';

export default function PageHero({ eyebrow, title, subtitle, className = '' }) {
  return (
    <section className={`border-b border-gray-100 bg-gradient-to-b from-white via-gray-50/80 to-gray-50 ${className}`}>
      <div className="container py-10 sm:py-12 md:py-14 text-center max-w-3xl mx-auto px-4">
        {eyebrow && (
          <p className="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-[0.2em] mb-2">{eyebrow}</p>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primary-900 tracking-tight mb-3">{title}</h1>
        {subtitle && <p className="text-text-muted text-base md:text-lg leading-relaxed">{subtitle}</p>}
      </div>
    </section>
  );
}
