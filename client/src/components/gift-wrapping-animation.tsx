import React, { useState, useEffect } from 'react';

interface GiftWrappingAnimationProps {
  friendName?: string;
  friendAvatar?: string;
}

export const GiftWrappingAnimation: React.FC<GiftWrappingAnimationProps> = ({ 
  friendName = "your friend", 
  friendAvatar 
}) => {
  const [step, setStep] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    `🧠 Analyzing ${friendName}'s personality...`,
    `🎯 Finding perfect matches...`,
    `🤖 AI is thinking creatively...`,
    `✨ Almost ready with amazing ideas...`
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((prev) => (prev + 1) % 5);
    }, 1200);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(messageInterval);
    };
  }, [loadingMessages.length]);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
      <div className="relative w-32 h-32 mb-6">
        {/* Friend's Avatar Circle */}
        {friendAvatar && (
          <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full border-4 border-white shadow-lg overflow-hidden transition-all duration-700 ${
            step >= 0 ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-75 rotate-45'
          }`}>
            <img 
              src={friendAvatar} 
              alt={friendName}
              className="w-full h-full object-cover"
            />
            {/* AI thinking indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-500 ${
              step >= 1 ? 'opacity-100 animate-pulse' : 'opacity-0'
            }`}>
              <span className="text-white text-xs">🤖</span>
            </div>
          </div>
        )}

        {/* Central Gift Box */}
        <div className={`absolute inset-4 bg-gradient-to-br from-rose-400 to-rose-500 rounded-lg transition-all duration-700 shadow-xl ${
          step >= 0 ? 'opacity-100 transform scale-100 rotate-0' : 'opacity-0 transform scale-75 rotate-12'
        }`}>
          {/* Box Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 rounded-lg"></div>
          
          {/* Question Mark (thinking phase) */}
          <div className={`absolute inset-0 flex items-center justify-center text-white text-2xl font-bold transition-all duration-500 ${
            step >= 1 && step < 3 ? 'opacity-100 animate-bounce' : 'opacity-0'
          }`}>
            ?
          </div>
        </div>

        {/* Ribbon Horizontal */}
        <div className={`absolute top-1/2 left-2 right-2 h-4 bg-gradient-to-r from-amber-400 to-amber-500 transform -translate-y-1/2 transition-all duration-700 ${
          step >= 2 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-30"></div>
        </div>

        {/* Ribbon Vertical */}
        <div className={`absolute top-2 bottom-2 left-1/2 w-4 bg-gradient-to-b from-amber-400 to-amber-500 transform -translate-x-1/2 transition-all duration-700 ${
          step >= 2 ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-30"></div>
        </div>

        {/* Enhanced Bow */}
        <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 transition-all duration-700 ${
          step >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}>
          {/* Bow Left */}
          <div className="absolute -left-4 top-0 w-8 h-5 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full transform rotate-15 shadow-md"></div>
          {/* Bow Right */}
          <div className="absolute -right-4 top-0 w-8 h-5 bg-gradient-to-bl from-amber-300 to-amber-500 rounded-full transform -rotate-15 shadow-md"></div>
          {/* Bow Center */}
          <div className="absolute -left-1.5 top-1 w-3 h-4 bg-gradient-to-b from-amber-400 to-amber-600 rounded-sm shadow-sm"></div>
        </div>

        {/* Magic Sparkles */}
        {step >= 4 && (
          <>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full animate-ping shadow-sm"
                style={{
                  left: `${10 + (i * 15)}%`,
                  top: `${5 + (i * 20)}%`,
                  animationDelay: `${i * 300}ms`,
                  animationDuration: '1.8s'
                }}
              >
                <div className="absolute inset-0 bg-white opacity-50 rounded-full"></div>
              </div>
            ))}
          </>
        )}

        {/* AI Progress Rings */}
        <div className={`absolute inset-0 border-4 border-blue-200 rounded-full transition-all duration-1000 ${
          step >= 1 ? 'opacity-100 animate-spin' : 'opacity-0'
        }`} style={{ animationDuration: '3s' }}>
          <div className="absolute inset-2 border-2 border-purple-200 rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
        </div>
      </div>

      {/* Enhanced Loading Text */}
      <div className="text-center max-w-xs">
        <p className="text-lg font-semibold text-gray-800 mb-2 transition-all duration-500">
          {loadingMessages[messageIndex]}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Creating perfect gift ideas for {friendName}
        </p>
        
        {/* Progress Dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className="w-2.5 h-2.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-bounce"
              style={{ animationDelay: `${dot * 200}ms` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};
