import React from 'react';

const Logo = ({ className = '', showText = true, size = 'default' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo Image */}
      <img 
        src="/logoaskcweb.png" 
        alt="askc web logo" 
        className={`${sizeClasses[size]} object-contain rounded-full`}
      />
      
      {/* Text */}
      {showText && (
        <span className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 bg-clip-text text-transparent tracking-wide">
          askc web
        </span>
      )}
    </div>
  );
};

export default Logo;

