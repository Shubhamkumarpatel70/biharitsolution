import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';

const projects = [
	{
		title: 'E-commerce Platform',
		desc: 'Scalable online store with secure payments and admin dashboard.',
		category: 'E-commerce',
		tech: ['React', 'Node', 'Stripe'],
		icon: 'cart',
		color: '#4facfe',
		highlight: 'Payments & inventory live',
	},
	{
		title: 'SaaS Analytics',
		desc: 'Real-time analytics dashboard with multi-tenant support.',
		category: 'SaaS',
		tech: ['React', 'Express', 'MongoDB'],
		icon: 'chart',
		color: '#667eea',
		highlight: 'Sub-second dashboards',
	},
	{
		title: 'Portfolio CMS',
		desc: 'Headless CMS powered portfolio with blazing fast performance.',
		category: 'Web App',
		tech: ['React', 'Next.js', 'Tailwind'],
		icon: 'palette',
		color: '#764ba2',
		highlight: 'Lighthouse 95+',
	},
	{
		title: 'Mobile App',
		desc: 'Cross-platform mobile application with native performance.',
		category: 'Mobile',
		tech: ['React Native', 'Firebase', 'Redux'],
		icon: 'smartphone',
		color: '#f093fb',
		highlight: 'iOS & Android',
	},
	{
		title: 'Enterprise Dashboard',
		desc: 'Comprehensive business intelligence and reporting platform.',
		category: 'Enterprise',
		tech: ['Vue.js', 'Python', 'PostgreSQL'],
		icon: 'trending',
		color: '#43e97b',
		highlight: 'Role-based access',
	},
	{
		title: 'Learning Platform',
		desc: 'Interactive e-learning system with video streaming and quizzes.',
		category: 'Education',
		tech: ['React', 'Node.js', 'MongoDB'],
		icon: 'graduation',
		color: '#fa709a',
		highlight: 'Streaming & progress',
	},
];

function Projects() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	return (
		<section className="py-16 md:py-24 bg-white">
			<div className="container">
				<div className="section-header">
					<h2 className="section-title">Latest Projects</h2>
					<p className="section-subtitle max-w-2xl mx-auto">
						A snapshot of our recent work—product builds, platforms, and experiences we ship end to end.
					</p>
				</div>

				{/* Mobile: horizontal scroll; md+: grid */}
				<div
					className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-thin md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 lg:gap-8 md:overflow-visible md:pb-0"
				>
					{projects.map((p, index) => (
						<div
							key={p.title}
							className={`
								group relative bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50
								transition-all duration-300 hover:-translate-y-1 overflow-hidden shrink-0 w-[min(100%,320px)] md:w-auto snap-center
								${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
							`}
							style={{ transitionDelay: `${index * 0.06}s` }}
						>
							<div
								className="relative h-44 md:h-48 bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center overflow-hidden"
							>
								<div
									className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
									style={{ background: `linear-gradient(135deg, ${p.color}18, ${p.color}35)` }}
								/>
								<div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
								<div className="relative z-10 text-primary-600 transition-transform duration-300 group-hover:scale-105">
									<Icon name={p.icon} className="w-14 h-14 md:w-20 md:h-20" />
								</div>
								<div className="absolute top-3 right-3">
									<span
										className="px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-md shadow-sm"
										style={{ background: `${p.color}cc` }}
									>
										{p.category}
									</span>
								</div>
							</div>

							<div className="p-5 md:p-6">
								<p className="text-xs font-semibold uppercase tracking-wide text-accent-600 mb-1">{p.highlight}</p>
								<h3 className="text-lg md:text-xl font-bold text-primary-600 mb-2 leading-snug">{p.title}</h3>
								<p className="text-text-muted text-sm leading-relaxed mb-4">{p.desc}</p>
								<div className="flex flex-wrap gap-2">
									{p.tech.map((t) => (
										<span
											key={t}
											className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-text-main rounded-lg text-xs font-medium"
										>
											{t}
										</span>
									))}
								</div>
							</div>
						</div>
					))}
				</div>

				<div className="mt-12 md:mt-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-light/80 to-white px-5 py-5 md:px-8">
					<p className="text-text-muted text-sm md:text-base max-w-xl">
						Planning something similar? We can scope architecture, timeline, and stack together—no obligation.
					</p>
					<Link
						to="/services"
						className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-colors shadow-md shrink-0"
					>
						View our services
						<Icon name="arrowRight" className="w-4 h-4" />
					</Link>
				</div>
			</div>
		</section>
	);
}

export default Projects;
