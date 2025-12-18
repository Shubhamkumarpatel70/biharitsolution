import React, { useState, useEffect } from 'react';

const stack = [
	{ 
		title: 'Frontend', 
		icon: '💻',
		items: ['React', 'Vite/CRA', 'Tailwind CSS', 'Redux Toolkit', 'TypeScript', 'Next.js'],
		color: '#4facfe'
	},
	{ 
		title: 'Backend', 
		icon: '⚙️',
		items: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'GraphQL', 'PostgreSQL'],
		color: '#667eea'
	},
	{ 
		title: 'DevOps', 
		icon: '🚀',
		items: ['Vercel/Netlify', 'Docker', 'CI/CD', 'NGINX', 'AWS', 'GitHub Actions'],
		color: '#764ba2'
	},
	{ 
		title: 'Quality', 
		icon: '✅',
		items: ['Jest', 'ESLint', 'Prettier', 'Cypress', 'Testing Library', 'TypeScript'],
		color: '#f093fb'
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
					<p className="section-subtitle">
						Modern, proven technologies for reliable products
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
					{stack.map((category, index) => (
						<div 
							key={category.title} 
							className={`group relative bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 ${
								isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
							}`}
							style={{ transitionDelay: `${index * 0.1}s` }}
						>
							<div className="text-center mb-4">
								<div 
									className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mx-auto mb-3 transition-transform duration-300 group-hover:scale-110"
									style={{ background: `${category.color}20`, color: category.color }}
								>
									{category.icon}
								</div>
								<h3 className="text-xl font-bold text-primary-600">{category.title}</h3>
							</div>
							<div className="flex flex-wrap gap-2 justify-center">
								{category.items.map(item => (
									<span 
										key={item} 
										className="px-3 py-1.5 bg-gray-light text-text-main rounded-lg text-xs font-medium hover:bg-accent-500/10 hover:text-accent-500 transition-colors duration-300"
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
