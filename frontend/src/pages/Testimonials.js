import React, { useEffect, useState } from 'react';

const testimonials = [
	{ name: 'Sarah Johnson', role: 'CEO, TechStart', content: 'askc web delivered an amazing website that exceeded our expectations. The team was professional and responsive throughout the entire process.', rating: 5, avatar: '👩\u00100' },
	{ name: 'Mike Chen', role: 'Founder, DigitalCraft', content: 'Outstanding service and quality! Our e-commerce site is performing better than ever. Highly recommended for any web development needs.', rating: 5, avatar: '👨\u0010b' },
	{ name: 'Emily Rodriguez', role: 'Marketing Director, GrowthCo', content: 'The SEO and marketing services helped us increase our online visibility by 300%. The results speak for themselves!', rating: 5, avatar: '👩\u00103' },
];

function Testimonials() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setIsVisible(true), 50);
		return () => clearTimeout(timer);
	}, []);

	return (
		<section className="testimonials-section">
			<div className="container">
				<div className="testimonials-container">
					<button className="testimonial-nav" aria-label="Previous">←</button>
					<div className="testimonial-card">
						<div className="testimonial-rating">
							{[...Array(5)].map((_, i) => (
								<span key={i} className="star">⭐</span>
							))}
						</div>
						<p className="testimonial-quote">"{testimonials[0].content}"</p>
						<div className="testimonial-author">
							<div className="author-avatar" aria-hidden="true">{testimonials[0].avatar}</div>
							<div className="author-info">
								<h4>{testimonials[0].name}</h4>
								<p>{testimonials[0].role}</p>
							</div>
						</div>
					</div>
					<button className="testimonial-nav" aria-label="Next">→</button>
				</div>
				<div className="testimonial-dots">
					<button className="dot active" aria-label="Slide 1"></button>
					<button className="dot" aria-label="Slide 2"></button>
					<button className="dot" aria-label="Slide 3"></button>
				</div>
			</div>
		</section>
	);
}

export default Testimonials;


