import React, { useState } from 'react';

const Tooltip = ({ children, content, disabled = false, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !content) {
    return children;
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 z-50 transition-opacity duration-200 opacity-100">
          <div className="bg-white border-2 border-red-500 rounded-lg shadow-xl px-5 py-4 max-w-sm">
            <div className="text-red-600 font-semibold text-lg leading-snug text-center">
              {content}
            </div>
            {/* 小三角形箭头 */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div 
                className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500"
                style={{ borderLeftWidth: '10px', borderRightWidth: '10px', borderTopWidth: '10px' }}
              ></div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-px">
                <div 
                  className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"
                  style={{ borderLeftWidth: '8px', borderRightWidth: '8px', borderTopWidth: '8px' }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
