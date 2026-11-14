import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import axios from '../axios';

const Payment = () => {
  const { plan } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPlanId = location.state?.planId;
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const [planObj, setPlanObj] = useState(null);
  const [coupon, setCoupon] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cashfree');
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [paymentImage, setPaymentImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch plans
        const plansRes = await axios.get('/api/auth/plans');
        const availablePlans = Array.isArray(plansRes.data)
          ? plansRes.data
          : Array.isArray(plansRes.data?.plans)
            ? plansRes.data.plans
            : [];
        setPlans(availablePlans);

        // Prefer the stable database ID passed by the Pricing CTA. Keep slug
        // matching as a fallback for existing/shared payment URLs.
        const normalizePlan = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const requestedPlan = normalizePlan(plan);
        const found = availablePlans.find(p => {
          if (selectedPlanId && String(p?._id) === String(selectedPlanId)) return true;
          if (p?._id && String(p._id) === String(plan)) return true;
          const planName = normalizePlan(p?.name);
          return planName === requestedPlan ||
            planName.replace(/plan$/, '') === requestedPlan ||
            requestedPlan.replace(/plan$/, '') === planName;
        });

        if (found) {
          setAmount(Number(found.price) || 0);
          setPlanObj(found);
          setError('');
        } else {
          setError('The selected pricing plan could not be found. Please return to Pricing and select a plan again.');
          console.warn('Pricing plan lookup failed:', { requestedPlan: plan, selectedPlanId, availablePlans: availablePlans.map(p => ({ id: p._id, name: p.name })) });
        }

        // Read the server-controlled checkout mode before exposing either payment flow.
        const settingsRes = await axios.get('/api/auth/payment-settings', { headers: { 'Cache-Control': 'no-cache' } });
        const configuredMode = settingsRes.data?.mode;
        if (!['manual', 'cashfree'].includes(configuredMode)) throw new Error('Payment mode is not configured.');
        if (configuredMode === 'cashfree' && settingsRes.data?.gatewayReady !== true) {
          throw new Error('Cashfree is selected by the administrator but gateway credentials are not configured. Please contact support.');
        }
        setPaymentMode(configuredMode);
        setPaymentMethod(configuredMode === 'manual' ? 'upi' : 'cashfree');

        // Fetch payment options only for manual payment.
        try {
          const paymentRes = await axios.get('/api/auth/payment-options');
          const options = Array.isArray(paymentRes.data?.paymentOptions) ? paymentRes.data.paymentOptions : [];
          setPaymentOptions(options);
          if (options.length > 0) setSelectedPaymentOption(options[0]);
        } catch (paymentError) {
          // Payment options are only needed for manual UPI/QR; Cashfree can still be used.
          console.error('Error fetching manual payment options:', paymentError);
          setPaymentOptions([]);
        }
      } catch (err) {
        console.error('Error fetching payment page data:', {
          message: err.message,
          url: err.config?.url,
          status: err.response?.status,
          response: err.response?.data
        });
        const apiMessage = err.response?.data?.message;
        setError(apiMessage || err.message || 'Unable to load payment configuration. Please try again.');
      } finally {
        setLoadingPlan(false);
      }
    };
    fetchData();
  }, [plan, selectedPlanId]);

  useEffect(() => {
    const orderId = searchParams.get('cashfree_order_id');
    const token = localStorage.getItem('token');
    if (!orderId || !token) return;
    let cancelled = false;
    const verify = async () => {
      setStatus('processing');
      try {
        const response = await axios.post('/api/auth/cashfree/verify-order', { orderId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (cancelled) return;
        if (response.data.status === 'active') {
          setSubscription(response.data.subscription);
          setStatus('success');
        } else {
          setStatus('idle');
          setError(response.data.message || 'Payment is still pending. Please check again shortly.');
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err.response?.data?.message || 'Payment verification could not be completed. Please retry.');
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [searchParams]);

  if (loadingPlan) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center" role="status" aria-live="polite">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Loading your selected plan…</p>
        </div>
      </div>
    );
  }

  if (!paymentMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-lg">
          <h2 className="text-xl font-bold text-slate-900">Payment temporarily unavailable</h2>
          <p className="mt-2 text-sm text-slate-600">{error || 'Payment configuration could not be loaded. Please try again later.'}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">Retry</button>
        </div>
      </div>
    );
  }

  if (!planObj) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center text-red-500 text-xl font-medium">
          <div className="mb-4">{error || 'This plan is not available.'}</div>
          <div className="text-sm text-slate-500 mb-4">
            Selected plan: "{plan}". Available plans:
          </div>
          <div className="text-sm text-slate-600 mb-4">
            {plans.map(p => p.name).join(', ')}
          </div>
          <button
            onClick={() => navigate('/plans')}
            className="bg-blue-600 hover:bg-blue-700 text-slate-900 px-4 py-2 rounded-lg transition-colors"
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    setCouponMsg('');
    setApplyingCoupon(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCouponMsg('Please log in to apply coupons.');
        setApplyingCoupon(false);
        return;
      }
      const res = await axios.post('/api/auth/coupons/apply', { code: coupon }, { headers: { Authorization: `Bearer ${token}` } });
      const appliedDiscount = Math.min(Number(res.data.amount) || 0, Number(amount) || 0);
      setDiscount(appliedDiscount);
      setCouponMsg(`Coupon applied! ₹${appliedDiscount} off.`);
    } catch (err) {
      setDiscount(0);
      setCouponMsg(err.response?.data?.message || 'Invalid coupon.');
    }
    setApplyingCoupon(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select a valid image file.'); return; }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        e.target.value = '';
        return;
      }
      setPaymentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };


  const handleCashfreePayment = async () => {
    if (paymentMode !== 'cashfree') { setError('Cashfree checkout is disabled by the administrator.'); return; }
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (!/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      setError('Enter a valid 10-digit mobile number for payment.');
      return;
    }
    setStatus('processing');
    setError('');
    try {
      const response = await axios.post('/api/auth/cashfree/create-order', {
        plan: planObj.name, phone: phone.replace(/\D/g, '').slice(-10), couponCode: discount > 0 ? coupon.trim().toUpperCase() : ''
      }, { headers: { Authorization: `Bearer ${token}` } });
      const loadCashfree = () => new Promise((resolve, reject) => {
        if (window.Cashfree) return resolve();
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Unable to load secure checkout.'));
        document.body.appendChild(script);
      });
      await loadCashfree();
      const cashfree = window.Cashfree({ mode: response.data.environment === 'production' ? 'production' : 'sandbox' });
      await cashfree.checkout({ paymentSessionId: response.data.paymentSessionId, redirectTarget: '_self' });
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || err.message || 'Could not start Cashfree checkout.');
    }
  };

  const handleRetryCashfreeVerification = async () => {
    const orderId = searchParams.get('cashfree_order_id');
    const token = localStorage.getItem('token');
    if (!orderId || !token) return;
    setStatus('processing');
    setError('');
    try {
      const response = await axios.post('/api/auth/cashfree/verify-order', { orderId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'active') {
        setSubscription(response.data.subscription);
        setStatus('success');
      } else {
        setStatus('idle');
        setError(response.data.message || 'Payment is not confirmed yet. Please check again shortly.');
      }
    } catch (err) {
      setStatus('idle');
      setError(err.response?.data?.message || 'Could not verify payment. Please try again.');
    }
  };

  const handlePayment = async () => {
    if (paymentMode !== 'manual') { setError('Manual payment is disabled. Please use the configured online gateway.'); return; }
    if (!transactionId) {
      setError('Please enter your transaction ID.');
      return;
    }
    
    if (!paymentImage) {
      setError('Please upload payment screenshot/receipt.');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to complete your payment.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }
    
    setStatus('processing');
    setError('');
    try {
      // Create FormData to send image
      const formData = new FormData();
      formData.append('plan', planObj.name);
      formData.append('transactionId', transactionId);
      formData.append('method', paymentMethod === 'qr' ? 'upi' : paymentMethod);
      formData.append('paymentImage', paymentImage);
      if (discount > 0 && coupon.trim()) formData.append('couponCode', coupon.trim().toUpperCase());
      
      // Don't set Content-Type header - let axios/browser set it with boundary
      const res = await axios.post(
        '/api/auth/subscribe', 
        formData, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`
            // Content-Type will be set automatically by axios for FormData
          } 
        }
      );
      setSubscription(res.data.subscription);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      console.error('Payment error:', err);
      console.error('API Error:', err.response?.data);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please try again later or contact support.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Redirect to login after a delay
        setTimeout(() => navigate('/login'), 3000);
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid request. Please check your input.');
      } else {
        setError(err.response?.data?.message || 'Payment or subscription failed. Please try again.');
      }
    }
  };

  const totalAmount = Math.max(0, Number(amount || 0) - Number(discount || 0));

  // Generate UPI deep link for QR and intents
  const generateUPIQR = () => {
    if (!selectedPaymentOption) return '';
    const params = new URLSearchParams({
      pa: selectedPaymentOption.upiId,          // payee address (UPI ID)
      pn: 'CustomWeb',                          // payee name
      am: String(totalAmount || 0),             // amount
      cu: 'INR',                                // currency
      tn: `${planObj?.name} Plan Payment`       // note
    });
    return `upi://pay?${params.toString()}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 w-full max-w-xl min-w-0 overflow-hidden">
        {/* Back Button */}
        <button
          onClick={() => navigate('/plans')}
          className="mb-4 text-sm text-blue-400 hover:underline"
        >
          ← Back to Plans
        </button>
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Complete Your Payment
          </h2>
          <p className="text-slate-500">For {planObj.name} Plan</p>
        </div>

        {status === 'idle' && (
          <>
            {/* Plan Details */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Plan:</span>
                <span className="font-medium">{planObj.name}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Amount:</span>
                <span>₹{amount}</span>
              </div>
              {discount > 0 && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Discount:</span>
                    <span className="text-blue-700 font-medium">-₹{discount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-medium">Total:</span>
                    <span className="text-slate-900 font-bold">₹{totalAmount}</span>
                  </div>
                </>
              )}
            </div>

            {/* The payment route is selected centrally by the administrator. Customers cannot switch modes. */}
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment method configured by ASKC Technologies</p>
              {paymentMode === 'cashfree' ? (
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-700"><span>●</span> Cashfree secure online checkout · Automatic confirmation</div>
              ) : (
                <>
                  <div className="mt-2 text-sm font-semibold text-slate-800">Manual payment · Admin verification required</div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setPaymentMethod('upi')} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${paymentMethod === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}>Manual UPI</button>
                    <button type="button" onClick={() => setPaymentMethod('qr')} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${paymentMethod === 'qr' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}>Manual QR</button>
                  </div>
                </>
              )}
            </div>
            {paymentMethod === 'cashfree' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 mb-6">
                <div className="font-semibold text-slate-900 mb-1">Pay securely with Cashfree</div>
                <p className="text-sm text-slate-600 mb-4">UPI, cards, net banking and supported methods. Your subscription activates automatically after Cashfree confirms payment.</p>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="cashfree-phone">Mobile number</label>
                <input id="cashfree-phone" type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0,10))} placeholder="10-digit mobile number" className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                <button type="button" onClick={handleCashfreePayment} disabled={status === 'processing' || phone.length !== 10} className="mt-4 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{status === 'processing' ? 'Connecting to Cashfree…' : `Pay ₹${totalAmount} securely`}</button>
              </div>
            )}

            {/* Coupon Section */}
            <div className="mb-6">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 mb-2 w-full">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={coupon}
                  onChange={e => {
                    setCoupon(e.target.value);
                    setCouponMsg('');
                    setDiscount(0);
                  }}
                  className="min-w-0 w-full bg-blue-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={applyingCoupon || discount > 0}
                />
                {discount > 0 ? (
                  <button
                    onClick={() => {
                      setCoupon('');
                      setDiscount(0);
                      setCouponMsg('');
                    }}
                    className="shrink-0 whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !coupon}
                    className="shrink-0 whitespace-nowrap bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                )}
              </div>
              {couponMsg && (
                <div className={`text-sm flex items-center gap-2 ${couponMsg.includes('off') ? 'text-blue-700' : 'text-red-400'}`}>
                  {couponMsg.includes('off') ? (
                    <span>✔️</span>
                  ) : (
                    <span>❌</span>
                  )}
                  {couponMsg}
                </div>
              )}
            </div>

            {paymentMethod !== 'cashfree' && (
            <>
            {/* Payment Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="text-slate-600 text-sm font-medium mb-2">PAYMENT INSTRUCTIONS</h3>
              
              {/* Payment Option Selection */}
              {paymentOptions.length > 0 && (
                <div className="mb-4">
                  <label className="block text-slate-500 text-sm mb-2">Select Payment Method:</label>
                  <select
                    value={selectedPaymentOption?._id || ''}
                    onChange={(e) => {
                      const option = paymentOptions.find(opt => opt._id === e.target.value);
                      setSelectedPaymentOption(option);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {paymentOptions.map(option => (
                      <option key={option._id} value={option._id}>
                        {option.name} ({option.paymentType})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {selectedPaymentOption && (
                <>
                  {paymentMethod === 'qr' ? (
                    <>
                      <div className="mb-4">
                        <p className="text-slate-900 font-semibold text-base mb-3 flex items-center gap-2">
                          <span>📱</span>
                          <span>Scan QR Code to Pay ₹{totalAmount}</span>
                        </p>
                        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 flex justify-center">
                          <div className="text-center">
                            {/* QR image generated from the UPI deep link */}
                            <div className="bg-white p-3 rounded-lg shadow-md mb-3 inline-block">
                              <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generateUPIQR())}`}
                                alt={`UPI QR for ₹${totalAmount}`}
                                className="w-48 h-48 rounded-lg"
                              />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">Scan with any UPI app</p>
                            <p className="text-xs text-slate-500 mt-1">Google Pay, PhonePe, Paytm, etc.</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4">
                        <p className="text-slate-600 font-medium text-sm mb-2 flex items-center gap-2">
                          <span>💳</span>
                          <span>Or Pay Manually</span>
                        </p>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-500/50 transition-all duration-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-blue-700 text-lg font-semibold">{selectedPaymentOption.upiId}</span>
                            <button 
                              onClick={() => copyToClipboard(selectedPaymentOption.upiId)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 transform"
                            >
                              {copied ? '✓ Copied!' : 'Copy'}
                            </button>
                          </div>
                          {selectedPaymentOption.description && (
                            <p className="text-slate-500 text-xs mt-2">{selectedPaymentOption.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => copyToClipboard(generateUPIQR())}
                            className="px-4 py-2 bg-blue-50 hover:bg-gray-600 text-blue-400 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 transform"
                          >
                            {copied ? '✓ UPI Link Copied!' : '📋 Copy UPI Link'}
                          </button>
                          <a
                            href={generateUPIQR()}
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-slate-900 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 transform inline-flex items-center gap-1"
                          >
                            <span>🚀</span>
                            <span>Open in UPI App</span>
                          </a>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mb-3">
                      <p className="text-slate-600 font-medium text-sm mb-2 flex items-center gap-2">
                        <span>💳</span>
                        <span>Send payment to this {selectedPaymentOption.paymentType}:</span>
                      </p>
                      <div className="bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-500/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-blue-700 text-lg font-semibold">{selectedPaymentOption.upiId}</span>
                          <button 
                            onClick={() => copyToClipboard(selectedPaymentOption.upiId)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 transform"
                          >
                            {copied ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                        {selectedPaymentOption.description && (
                          <p className="text-slate-500 text-xs mt-2">{selectedPaymentOption.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="mb-4">
                <label htmlFor="transactionId" className="block text-slate-500 text-sm mb-1">
                  Transaction/Reference ID
                </label>
                <input
                  id="transactionId"
                  type="text"
                  placeholder="Enter ID from payment confirmation"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-slate-500 text-xs mt-1">
                  After successful payment, enter the transaction ID from your confirmation.
                </p>
              </div>
              
              {/* Payment Image Upload */}
              <div>
                <label htmlFor="paymentImage" className="block text-slate-500 text-sm mb-1">
                  Payment Screenshot/Receipt <span className="text-red-400">*</span>
                </label>
                <input
                  id="paymentImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-700 file:text-blue-800 hover:file:bg-blue-700"
                  required
                />
                <p className="text-slate-500 text-xs mt-1">
                  Upload screenshot or receipt of your payment confirmation (Required, Max 5MB)
                </p>
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-slate-500 text-sm mb-2">Preview:</p>
                    <img 
                      src={imagePreview} 
                      alt="Payment preview" 
                      className="max-w-full h-32 object-contain bg-white rounded-lg border border-slate-200 p-2"
                    />
                  </div>
                )}
              </div>
            </div>
            </>
            )}
            {paymentMethod !== 'cashfree' && (
            <>
            {/* Submit Button */}
            <button
              onClick={handlePayment}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={!transactionId || !paymentImage || status === 'processing'}
            >
              {status === 'processing' ? 'Processing...' : 'Confirm Payment'}
            </button>

            {error && (
              <div className="mt-4 text-red-400 text-center text-sm">
                {error}
              </div>
            )}
            </>
            )}
            {paymentMethod === 'cashfree' && error && (
              <div className="mt-3 text-center text-sm text-red-600">
                <p>{error}</p>
                {searchParams.get('cashfree_order_id') && (
                  <button type="button" onClick={handleRetryCashfreeVerification} className="mt-2 rounded-lg border border-blue-200 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50">Check payment status again</button>
                )}
              </div>
            )}
          </>
        )}

        {status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">Processing your payment...</p>
          </div>
        )}

        {status === 'success' && subscription && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-700 mb-2">{subscription.status === 'active' ? 'Payment Successful!' : 'Payment Submitted Successfully'}</h3>
            <p className="mb-5 text-sm text-slate-500">{subscription.status === 'active' ? 'Your payment has been verified and your plan is active.' : 'Your payment details have been submitted. Your plan will activate after ASKC TECHNOLOGIES verifies the payment.'}</p>
            <div className="bg-blue-50 rounded-2xl p-4 sm:p-5 mb-6 text-left space-y-3 min-w-0">
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Plan</span>
                <span className="text-right font-semibold text-slate-900 break-words">{subscription.planName || planObj?.name || subscription.plan || '—'}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Original plan price</span>
                <span className="text-right font-semibold text-slate-900">{'₹' + Number(subscription.totalAmount ?? amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Coupon used</span>
                <span className="text-right font-semibold text-slate-900 break-words">{subscription.couponCode ? subscription.couponCode : 'No coupon'}</span>
              </div>
              {Number(subscription.discountAmount || 0) > 0 && <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Coupon discount</span>
                <span className="text-right font-bold text-emerald-700">−{'₹' + Number(subscription.discountAmount).toLocaleString('en-IN')}</span>
              </div>}
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start border-t border-blue-100 pt-3">
                <span className="text-sm font-semibold text-slate-700">Payable amount</span>
                <span className="text-right font-bold text-slate-900">{'₹' + Number(subscription.amountPaid ?? Math.max(0, Number(subscription.totalAmount || amount || 0) - Number(subscription.discountAmount || 0))).toLocaleString('en-IN')}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Subscription ID</span>
                <span className="text-right font-mono text-xs sm:text-sm text-slate-800 break-all">{subscription.uniqueId || subscription._id || '—'}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Transaction ID</span>
                <span className="text-right font-mono text-xs sm:text-sm text-slate-800 break-all">{subscription.transactionId || subscription.cashfreeOrderId || transactionId || 'Awaiting verification'}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Payment status</span>
                <span className="text-right font-semibold capitalize text-slate-900 break-words">{subscription.paymentStatus || subscription.status || '—'}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
                <span className="text-sm text-slate-500">Subscription status</span>
                <span className="text-right font-semibold capitalize text-slate-900">{subscription.status || '—'}</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/purchases')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-slate-900 font-medium py-2 px-4 rounded-lg transition-all duration-300 hover:shadow-lg hover:scale-105 transform"
            >
              View My Purchases
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Payment Failed</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full bg-gray-600 hover:bg-blue-50 text-slate-900 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;