import React from 'react';

const Logo = ({ className = '', showText = true, size = 'default', theme = 'light' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const textClass = theme === 'dark' 
    ? "hidden md:block text-xl md:text-2xl font-black text-white tracking-wide"
    : "hidden md:block text-xl md:text-2xl font-black bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent tracking-wide";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image */}
      <img
        src="/askclogonew.jpeg"
        alt="ASKC Digital Web logo"
        className={`${sizeClasses[size]} object-contain rounded-xl border-2 border-primary-200 shadow-sm`}
      />

      {/* Text */}
      {showText && (
        <span className={textClass}>
          ASKC Digital Web
        </span>
      )}
    </div>
  );
};

export default Logo;

