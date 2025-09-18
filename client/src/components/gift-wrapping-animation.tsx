import React, { useState, useEffect } from 'react';

export const GiftWrappingAnimation: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-24 h-24 mb-6">
        {/* Gift Box Base */}
        <div className={`absolute inset-0 bg-gradient-to-br from-rose-400 to-rose-500 rounded-lg transition-all duration-700 shadow-lg ${
          step >= 0 ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-75'
        }`}>
          {/* Box Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-25 rounded-lg"></div>
        </div>

        {/* Ribbon Horizontal */}
        <div className={`absolute top-1/2 left-0 right-0 h-4 bg-gradient-to-r from-amber-400 to-amber-500 transform -translate-y-1/2 transition-all duration-700 ${
          step >= 1 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
        </div>

        {/* Ribbon Vertical */}
        <div className={`absolute top-0 bottom-0 left-1/2 w-4 bg-gradient-to-b from-amber-400 to-amber-500 transform -translate-x-1/2 transition-all duration-700 ${
          step >= 1 ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-30"></div>
        </div>

        {/* Bow */}
        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 transition-all duration-700 ${
          step >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}>
          {/* Bow Left */}
          <div className="absolute -left-3 top-0 w-6 h-4 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full transform rotate-15"></div>
          {/* Bow Right */}
          <div className="absolute -right-3 top-0 w-6 h-4 bg-gradient-to-bl from-amber-300 to-amber-500 rounded-full transform -rotate-15"></div>
          {/* Bow Center */}
          <div className="absolute -left-1 top-0.5 w-2 h-3 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm"></div>
        </div>

        {/* Simple Sparkles */}
        {step >= 3 && (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
                style={{
                  left: `${20 + (i * 20)}%`,
                  top: `${15 + (i * 15)}%`,
                  animationDelay: `${i * 400}ms`,
                  animationDuration: '1.5s'
                }}
              ></div>
            ))}
          </>
        )}
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-base font-medium text-gray-700 mb-3">
          🎁 Finding your perfect gifts...
        </p>
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
              style={{ animationDelay: `${dot * 200}ms` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
