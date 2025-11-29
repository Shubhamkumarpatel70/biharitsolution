import React, { useState, useEffect } from 'react';

const features = [
	{ icon: '⚡', title: 'Fast Delivery', desc: 'Rapid development with quality and performance in mind.', color: '#4facfe' },
	{ icon: '🎯', title: 'Results-Driven', desc: 'Solutions focused on your business goals and ROI.', color: '#667eea' },
	{ icon: '🔒', title: 'Secure by Design', desc: 'Best practices and modern security built-in.', color: '#764ba2' },
	{ icon: '📈', title: 'Scalable', desc: 'Architecture that grows with your business.', color: '#f093fb' },
	{ icon: '💡', title: 'Innovation', desc: 'Cutting-edge solutions using latest technologies.', color: '#43e97b' },
	{ icon: '🤝', title: '24/7 Support', desc: 'Round-the-clock assistance when you need it.', color: '#fa709a' },
];

function WhyChooseUs() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	return (
		<section className="py-16 md:py-24 bg-white">
			<div className="container">
				<div className="section-header">
					<h2 className="section-title">Why Choose Us</h2>
					<p className="section-subtitle">
						Building reliable digital solutions with modern, proven technologies that scale with your business.
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
					{features.map((f, index) => (
						<div 
							key={f.title} 
							className={`group relative bg-white rounded-xl p-6 border border-gray-200 shadow-md hover:shadow-gold-hover hover:border-accent-500/50 transition-all duration-300 hover:-translate-y-1 ${
								isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
							}`}
							style={{ transitionDelay: `${index * 0.1}s` }}
						>
							<div className="flex items-start gap-4">
								<div 
									className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
									style={{ background: `${f.color}20`, color: f.color }}
								>
									{f.icon}
								</div>
								<div className="flex-1">
									<h3 className="text-xl font-bold text-primary-600 mb-2">{f.title}</h3>
									<p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
								</div>
							</div>
							<div 
								className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-accent rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
							></div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export default WhyChooseUs;
