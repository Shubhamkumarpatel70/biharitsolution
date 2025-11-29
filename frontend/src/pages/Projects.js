import React, { useState, useEffect } from 'react';

const projects = [
	{ 
		title: 'E-commerce Platform', 
		desc: 'Scalable online store with secure payments and admin dashboard.', 
		category: 'E-commerce', 
		tech: ['React', 'Node', 'Stripe'],
		icon: '🛒',
		color: '#4facfe'
	},
	{ 
		title: 'SaaS Analytics', 
		desc: 'Real-time analytics dashboard with multi-tenant support.', 
		category: 'SaaS', 
		tech: ['React', 'Express', 'MongoDB'],
		icon: '📊',
		color: '#667eea'
	},
	{ 
		title: 'Portfolio CMS', 
		desc: 'Headless CMS powered portfolio with blazing fast performance.', 
		category: 'Web App', 
		tech: ['React', 'Next.js', 'Tailwind'],
		icon: '🎨',
		color: '#764ba2'
	},
	{ 
		title: 'Mobile App', 
		desc: 'Cross-platform mobile application with native performance.', 
		category: 'Mobile', 
		tech: ['React Native', 'Firebase', 'Redux'],
		icon: '📱',
		color: '#f093fb'
	},
	{ 
		title: 'Enterprise Dashboard', 
		desc: 'Comprehensive business intelligence and reporting platform.', 
		category: 'Enterprise', 
		tech: ['Vue.js', 'Python', 'PostgreSQL'],
		icon: '📈',
		color: '#43e97b'
	},
	{ 
		title: 'Learning Platform', 
		desc: 'Interactive e-learning system with video streaming and quizzes.', 
		category: 'Education', 
		tech: ['React', 'Node.js', 'MongoDB'],
		icon: '🎓',
		color: '#fa709a'
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
					<p className="section-subtitle">
						A snapshot of our recent work
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					{projects.map((p, index) => (
						<div 
							key={p.title} 
							className={`group relative bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
								isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
							}`}
							style={{ transitionDelay: `${index * 0.1}s` }}
						>
							{/* Project Image/Icon Area */}
							<div 
								className="relative h-48 bg-gradient-to-br from-primary-500/10 to-accent-500/10 flex items-center justify-center overflow-hidden"
							>
								<div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(135deg, ${p.color}20, ${p.color}40)` }}></div>
								<div className="relative z-10 text-6xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
									{p.icon}
								</div>
								<div className="absolute top-4 right-4">
									<span 
										className="px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-md"
										style={{ background: `${p.color}80` }}
									>
										{p.category}
									</span>
								</div>
							</div>
							
							{/* Project Content */}
							<div className="p-6">
								<h3 className="text-xl font-bold text-primary-600 mb-2">{p.title}</h3>
								<p className="text-text-muted text-sm leading-relaxed mb-4">{p.desc}</p>
								<div className="flex flex-wrap gap-2">
									{p.tech.map(t => (
										<span 
											key={t} 
											className="px-2.5 py-1 bg-gray-light text-text-main rounded-lg text-xs font-medium"
										>
											{t}
										</span>
									))}
								</div>
							</div>
							
							{/* Bottom Gradient */}
							<div 
								className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
							></div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default Projects;
