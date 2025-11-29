import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function CTA() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		setIsVisible(true);
	}, []);

	return (
		<section className="relative py-16 md:py-24 overflow-hidden">
			{/* Background Gradient */}
			<div className="absolute inset-0 bg-gradient-primary opacity-95"></div>
			
			{/* Animated Background Shapes */}
			<div className="absolute inset-0 opacity-20" aria-hidden="true">
				<div className="absolute top-0 left-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-600 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
			</div>

			{/* Floating Particles */}
			<div className="absolute inset-0 overflow-hidden" aria-hidden="true">
				<div className="absolute top-20 left-10 w-3 h-3 bg-accent-500 rounded-full animate-float opacity-60"></div>
				<div className="absolute top-40 right-20 w-2 h-2 bg-accent-400 rounded-full animate-float opacity-60" style={{ animationDelay: '1s' }}></div>
				<div className="absolute bottom-32 left-1/4 w-4 h-4 bg-accent-500 rounded-full animate-float opacity-60" style={{ animationDelay: '2s' }}></div>
				<div className="absolute bottom-20 right-1/3 w-2 h-2 bg-accent-400 rounded-full animate-float opacity-60" style={{ animationDelay: '0.5s' }}></div>
			</div>

			<div className="container relative z-10">
				<div 
					className={`max-w-4xl mx-auto text-center ${
						isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
					} transition-all duration-700`}
				>
					{/* Badge */}
					<div className="inline-block px-4 py-2 mb-6 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-sm font-semibold text-white shadow-lg">
						🚀 Get Started Today
					</div>

					{/* Main Heading */}
					<h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
						Ready to build something great?
					</h2>

					{/* Subtitle */}
					<p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto">
						Let's turn your idea into a high-performing product your users will love.
					</p>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Link 
							to="/contact" 
							className="group relative px-8 py-4 bg-gradient-accent text-primary-900 font-bold rounded-xl shadow-gold hover:shadow-gold-hover transition-all duration-300 hover:-translate-y-1 min-w-[200px] flex items-center justify-center gap-2"
						>
							<span>Start Your Project</span>
							<span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
						</Link>
						<Link 
							to="/plans" 
							className="group px-8 py-4 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:-translate-y-1 min-w-[200px] flex items-center justify-center"
						>
							View Pricing
						</Link>
					</div>

					{/* Additional Info */}
					<div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80 text-sm">
						<div className="flex items-center gap-2">
							<span className="text-xl">✓</span>
							<span>Free Consultation</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xl">✓</span>
							<span>No Hidden Fees</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xl">✓</span>
							<span>24/7 Support</span>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export default CTA;
