import React from 'react';

const LoadingSpinner = ({ size = 'large', message = 'Loading...', fullScreen = true }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3'
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className="relative">
          {/* Main spinner */}
          <div 
            className={`${sizeClasses[size]} border-white border-opacity-30 border-t-white rounded-full animate-spin mx-auto`}
          ></div>
          
          {/* Secondary spinner */}
          <div 
            className={`absolute inset-0 ${sizeClasses[size]} border-transparent border-t-white border-opacity-20 rounded-full animate-ping mx-auto`}
            style={{ animationDuration: '2s' }}
          ></div>
        </div>
        
        {message && (
          <p className={`mt-4 text-white ${fullScreen ? 'text-lg' : 'text-sm'} font-medium animate-pulse`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Inline spinner for buttons and small areas
export const InlineSpinner = ({ size = 'small', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2'
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-current border-opacity-30 border-t-current rounded-full animate-spin ${className}`}
    ></div>
  );
};

// Loading overlay for content areas
export const LoadingOverlay = ({ children, isLoading, message = 'Processing...' }) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <InlineSpinner size="medium" className="mx-auto text-primary-500" />
            <p className="mt-2 text-gray-600 text-sm">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Loading skeleton for content
export const LoadingSkeleton = ({ className = '', lines = 3 }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className="bg-gray-300 rounded h-4 mb-2 last:mb-0"
          style={{ width: `${Math.random() * 30 + 70}%` }}
        ></div>
      ))}
    </div>
  );
};

// Card loading skeleton
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-soft animate-pulse ${className}`}>
      <div className="bg-gray-300 rounded-lg h-48 mb-4"></div>
      <div className="bg-gray-300 rounded h-6 mb-2"></div>
      <div className="bg-gray-300 rounded h-4 mb-2 w-3/4"></div>
      <div className="bg-gray-300 rounded h-4 w-1/2"></div>
    </div>
  );
};

export default LoadingSpinner;