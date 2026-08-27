
import React from 'react';
import { EMOJI_ORACLE_BOOK_URL } from '../constants'; // Removed WIZARD_BUNNY_MASCOT_URL as it's not on this page

interface LoadingPageProps {
  progress: number; // 0-100 for the main progress bar
  statusText: string; // Single string for status message
  showStartButton: boolean; // Controls start button visibility
  onStartClick: () => void; // Start button click handler
}

// Emojis selected to visually align with the screenshot's static elements
const ORBITING_EMOJIS = ['💡', '📖', '🌑', '🌈', '💬', '💖', '⭐', '✨', '🦄', '👻', '🚀', '🥳'];

const LoadingPage: React.FC<LoadingPageProps> = ({ progress, statusText, showStartButton, onStartClick }) => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full p-4 overflow-hidden">
      {/* Background is now handled by index.html body style */}
      {/* Removed internal gradient and cloud elements to let the body background image show */}

      {/* Main loading content area */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-100/30 to-purple-100/30 p-8 rounded-3xl shadow-xl max-w-xl w-full mx-4 sm:mx-auto z-10 backdrop-blur-sm"> {/* Adjusted bg to gradient, added backdrop-blur */}
        
        {/* Removed Wizard Bunny Mascot from LoadingPage */}

        {/* Combined Orbiting Emojis and Central Book Section */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-10"> {/* Adjusted margin-bottom */}
          {/* Orbiting Emojis Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full animate-spin-slow">
              {ORBITING_EMOJIS.map((emoji, index) => {
                const angle = (index / ORBITING_EMOJIS.length) * 2 * Math.PI;
                const radius = 120; // Reduced radius for closer orbit
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                return (
                  <span
                    key={emoji + index}
                    className="absolute text-2xl animate-pulse-emoji" // Adjusted emoji size
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${index * 0.15}s`, // Stagger delay
                    }}
                    role="img"
                    aria-label={`orbiting emoji ${emoji}`}
                  >
                    {emoji}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Emoji Oracle Book (matching screenshot size and no glow) */}
          <img
            src={EMOJI_ORACLE_BOOK_URL}
            alt="Emoji Oracle Book"
            className="w-48 h-48 object-contain drop-shadow-lg z-20" // Resized, removed glow-book
            aria-label="The Emoji Oracle Book"
          />
        </div>

        {/* Single Status Text */}
        <h2 className="text-3xl font-extrabold text-white mb-4 text-center text-shadow-md"> {/* Adjusted text size and color, added text-shadow */}
          {statusText}
        </h2>

        {/* Single Progress Bar with percentage - now visible */}
        <div className="w-full bg-gray-700/50 rounded-full h-3 relative overflow-hidden shadow-inner mb-8"> {/* Progress bar is now visible, updated background */}
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full transition-all duration-300 ease-out" // Vibrant gradient for progress
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label="Application Progress"
          ></div>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-white"> {/* White percentage text */}
            {Math.round(progress)}%
          </span>
        </div>

        {showStartButton && (
          <button
            onClick={onStartClick}
            className="mt-8 px-8 py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white text-2xl font-extrabold rounded-xl shadow-2xl hover:from-green-500 hover:to-blue-600 transition-all duration-300 active:scale-98 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-75"
            aria-label="Start your adventure"
          >
            Start My Adventure!
          </button>
        )}
      </div>

      {/* Tailwind CSS keyframes for animations and component-specific styles */}
      <style>{`
        /* Removed .progress-bar-hidden as it's no longer needed */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-emoji {
          0%, 100% { opacity: 0.8; transform: scale(1) translate(-50%, -50%); }
          50% { opacity: 1; transform: scale(1.2) translate(-50%, -50%); }
        }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }
        .animate-pulse-emoji { animation: pulse-emoji 2s ease-in-out infinite alternate; }
        .text-shadow-md {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
};

export default LoadingPage;