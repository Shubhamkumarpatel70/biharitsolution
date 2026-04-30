import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/icons';

const NotFound = () => {
  return (
    <section className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 md:p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Error</p>
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 mt-3 leading-none">404</h1>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-4">Page Not Found</h2>
          <p className="text-slate-600 text-sm md:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            The page you are looking for is unavailable or may have moved.
            Please use one of the options below.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="btn btn-primary px-6 py-3 rounded-xl text-sm md:text-base justify-center"
            >
              <Icon name="home" className="w-4 h-4" />
              Go to Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary px-6 py-3 rounded-xl text-sm md:text-base justify-center"
            >
              <Icon name="arrowRight" className="w-4 h-4 rotate-180" />
              Go Back
            </button>
            <Link
              to="/contact"
              className="btn btn-secondary px-6 py-3 rounded-xl text-sm md:text-base justify-center"
            >
              <Icon name="mail" className="w-4 h-4" />
              Contact Support
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <Link
              to="/plans"
              className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-slate-900 mb-1">View Plans</h3>
              <p className="text-xs text-slate-600">Pricing and packages.</p>
            </Link>
            <Link
              to="/services"
              className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-slate-900 mb-1">Our Services</h3>
              <p className="text-xs text-slate-600">What we offer.</p>
            </Link>
            <Link
              to="/about"
              className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-slate-900 mb-1">About Us</h3>
              <p className="text-xs text-slate-600">Know our team.</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;

