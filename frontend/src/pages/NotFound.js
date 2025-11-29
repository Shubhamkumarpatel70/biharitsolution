import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-light flex items-center justify-center px-4 pt-24">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-9xl font-black text-primary-600 mb-4">404</h1>
          <div className="text-6xl mb-6">🔍</div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-primary-600 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-lg text-text-muted mb-8">
          Oops! The page you're looking for doesn't exist. It might have been moved, deleted, or the URL might be incorrect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="px-8 py-4 bg-gradient-accent text-primary-900 font-bold rounded-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300"
          >
            🏠 Go to Home
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 font-bold rounded-lg hover:bg-primary-50 hover:scale-105 transform transition-all duration-300"
          >
            ← Go Back
          </button>
        </div>
        
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <Link
            to="/plans"
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-2xl mb-2">📦</div>
            <h3 className="font-semibold text-primary-600 mb-1">View Plans</h3>
            <p className="text-sm text-text-muted">Check out our pricing plans</p>
          </Link>
          
          <Link
            to="/services"
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-2xl mb-2">🛠️</div>
            <h3 className="font-semibold text-primary-600 mb-1">Our Services</h3>
            <p className="text-sm text-text-muted">Explore what we offer</p>
          </Link>
          
          <Link
            to="/contact"
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="text-2xl mb-2">📬</div>
            <h3 className="font-semibold text-primary-600 mb-1">Contact Us</h3>
            <p className="text-sm text-text-muted">Get in touch with us</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

