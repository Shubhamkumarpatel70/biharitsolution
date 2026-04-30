import React from 'react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <div className="prose prose-primary max-w-none text-gray-600 space-y-6">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, including when you create an account, make a purchase, 
            request customer support, or otherwise communicate with us. This may include your name, email address, phone number, 
            and payment information.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve our services.</li>
            <li>Process transactions and send related information.</li>
            <li>Send technical notices, updates, security alerts, and support messages.</li>
            <li>Respond to your comments, questions, and customer service requests.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to maintain the safety of your personal information. 
            However, no method of transmission over the Internet or electronic storage is 100% secure.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Third-Party Services</h2>
          <p>
            We may use third-party service providers to process payments, monitor web traffic, or assist us in analyzing how our 
            service is used. These third parties have access to your personal information only to perform these tasks on our behalf.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:contact@askcweb.in" className="text-primary-600 hover:text-primary-700">contact@askcweb.in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
