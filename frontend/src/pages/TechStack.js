import React, { useState, useEffect } from 'react';
import { Icon } from '../components/icons';

const stack = [
	{
		title: 'Frontend',
		icon: 'code',
		items: ['React', 'Vite/CRA', 'Tailwind CSS', 'Redux Toolkit', 'TypeScript', 'Next.js'],
		color: '#3b82f6',
		ring: 'ring-blue-100',
	},
	{
		title: 'Backend',
		icon: 'cog',
		items: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'GraphQL', 'PostgreSQL'],
		color: '#7c3aed',
		ring: 'ring-violet-100',
	},
	{
		title: 'DevOps',
		icon: 'bolt',
		items: ['Vercel/Netlify', 'Docker', 'CI/CD', 'NGINX', 'AWS', 'GitHub Actions'],
		color: '#6d28d9',
		ring: 'ring-violet-100',
	},
	{
		title: 'Quality',
		icon: 'check',
		items: ['Jest', 'ESLint', 'Prettier', 'Cypress', 'Testing Library', 'TypeScript'],
		color: '#db2777',
		ring: 'ring-pink-100',
	},
];

function TechStack() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	return (
		<section className="py-16 md:py-24 bg-gray-light">
			<div className="container">
				<div className="section-header">
					<h2 className="section-title">Technology Stack</h2>
					<p className="section-subtitle max-w-2xl mx-auto">
						Modern, proven technologies we use to ship reliable, maintainable products—from UI to deployment and quality gates.
					</p>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
					{stack.map((category, index) => (
						<div
							key={category.title}
							className={`
								group relative bg-white rounded-2xl p-6 md:p-7 border border-gray-200 shadow-md
								hover:shadow-xl hover:border-accent-500/45 hover:ring-2 hover:ring-accent-500/20
								transition-all duration-300 hover:-translate-y-1
								${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
							`}
							style={{ transitionDelay: `${index * 0.08}s` }}
						>
							<div className="text-center mb-5">
								<div
									className={`
										w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4
										ring-4 ring-offset-2 ring-offset-white transition-transform duration-300 group-hover:scale-105
										${category.ring}
									`}
									style={{ background: `${category.color}18`, color: category.color }}
								>
									<Icon name={category.icon} className="w-9 h-9" strokeWidth={2} />
								</div>
								<h3 className="text-lg md:text-xl font-bold text-primary-900">{category.title}</h3>
							</div>
							<div className="flex flex-wrap gap-2 justify-center">
								{category.items.map((item) => (
									<span
										key={item}
										className="px-3 py-1.5 rounded-full border border-slate-200/90 bg-slate-50/90 text-text-main text-xs font-medium text-center
											hover:border-accent-400/60 hover:bg-accent-500/5 hover:text-primary-800 transition-colors duration-200"
									>
										{item}
									</span>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default TechStack;
