import React from 'react';

const Refund = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Refund & Cancellation Policy</h1>
        
        <div className="prose prose-primary max-w-none text-gray-600 space-y-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Digital Products and Services</h2>
          <p>
            Due to the nature of our digital services and web development products, ASKC Digital Web does not offer refunds 
            once a project has commenced or a digital product has been delivered, except as explicitly stated in a signed 
            project contract.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Subscription Services</h2>
          <p>
            For recurring subscription plans, you may cancel your subscription at any time. Your cancellation will take effect 
            at the end of the current paid term. We do not provide prorated refunds for partial months of service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Web Development Projects</h2>
          <p>
            For custom web development services, an initial deposit is required. If you decide to cancel the project before 
            development has begun, the deposit may be partially refunded minus any consulting or administrative fees. 
            Once development work has commenced, the deposit becomes non-refundable.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Exceptional Circumstances</h2>
          <p>
            Refund requests for exceptional circumstances will be evaluated on a case-by-case basis. If you believe you are 
            entitled to a refund due to a technical failure on our end, please contact our support team within 7 days of the transaction.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
          <p>
            To request a cancellation or discuss a refund, please contact us at:{' '}
            <a href="mailto:contact@askcweb.in" className="text-primary-600 hover:text-primary-700">contact@askcweb.in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Refund;
