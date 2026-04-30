import React from 'react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-primary max-w-none text-gray-600 space-y-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using ASKC Digital Web's services, you agree to be bound by these Terms and Conditions. 
            If you disagree with any part of the terms, you may not access our services.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality are and will remain the exclusive property of 
            ASKC Digital Web and its licensors. Our services are protected by copyright, trademark, and other laws.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
            Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Limitation of Liability</h2>
          <p>
            In no event shall ASKC Digital Web, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable 
            for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, 
            data, use, goodwill, or other intangible losses.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:{' '}
            <a href="mailto:contact@askcweb.in" className="text-primary-600 hover:text-primary-700">contact@askcweb.in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
