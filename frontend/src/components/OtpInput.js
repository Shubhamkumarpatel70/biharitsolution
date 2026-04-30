import React, { useRef, useEffect } from 'react';

const OtpInput = ({ length = 6, value, onChange, disabled = false }) => {
  const inputRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    // Only allow numbers
    if (!/^\d*$/.test(val)) return;

    // We only care about the last character typed in this box
    const char = val.slice(-1);
    
    // Build new OTP string
    const newOtpArray = value.split('');
    // Pad array with spaces if needed
    while (newOtpArray.length < length) newOtpArray.push('');
    
    newOtpArray[index] = char;
    const newOtp = newOtpArray.join('').slice(0, length);
    onChange(newOtp);

    // Auto focus next input
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      const newOtpArray = value.split('');
      while (newOtpArray.length < length) newOtpArray.push('');

      // If current box has a value, clear it
      if (newOtpArray[index]) {
        newOtpArray[index] = '';
        onChange(newOtpArray.join(''));
      } else if (index > 0) {
        // If current box is empty, clear previous box and focus it
        newOtpArray[index - 1] = '';
        onChange(newOtpArray.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);
    
    // Focus the last filled input or the very last input if fully filled
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center items-center w-full my-4" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] || '';
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={char}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={disabled}
            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border border-gray-300 bg-white text-primary-900 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
            maxLength={2} // Allow typing to trigger onChange even if already filled
            aria-label={`OTP digit ${index + 1}`}
          />
        );
      })}
    </div>
  );
};

export default OtpInput;
