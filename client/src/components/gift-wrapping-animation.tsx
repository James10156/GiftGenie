import React, { useState, useEffect } from 'react';

export const GiftWrappingAnimation: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative w-32 h-32 mb-4">
        {/* Gift Box Base */}
        <div className={`absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 rounded-lg transition-all duration-1000 ${
          step >= 0 ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-50'
        }`}>
          {/* Box Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-20 rounded-lg"></div>
        </div>

        {/* Ribbon Horizontal */}
        <div className={`absolute top-1/2 left-0 right-0 h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 transform -translate-y-1/2 transition-all duration-1000 ${
          step >= 1 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
        </div>

        {/* Ribbon Vertical */}
        <div className={`absolute top-0 bottom-0 left-1/2 w-6 bg-gradient-to-b from-yellow-400 to-yellow-500 transform -translate-x-1/2 transition-all duration-1000 ${
          step >= 1 ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-30"></div>
        </div>

        {/* Bow */}
        <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 transition-all duration-1000 ${
          step >= 2 ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-180'
        }`}>
          {/* Bow Left */}
          <div className="absolute -left-4 top-0 w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full transform rotate-12"></div>
          {/* Bow Right */}
          <div className="absolute -right-4 top-0 w-8 h-6 bg-gradient-to-bl from-yellow-300 to-yellow-500 rounded-full transform -rotate-12"></div>
          {/* Bow Center */}
          <div className="absolute -left-1 top-1 w-2 h-4 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-sm"></div>
        </div>

        {/* Sparkles */}
        {step >= 3 && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping`}
                style={{
                  left: `${20 + (i * 15) % 80}%`,
                  top: `${10 + (i * 20) % 80}%`,
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '1.5s'
                }}
              >
                <div className="absolute inset-0 bg-yellow-200 rounded-full animate-pulse"></div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 mb-2">
          🎁 Wrapping your perfect gifts...
        </p>
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className={`w-2 h-2 bg-blue-500 rounded-full animate-bounce`}
              style={{ animationDelay: `${dot * 200}ms` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
