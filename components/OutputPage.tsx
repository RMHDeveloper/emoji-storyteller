
import React from 'react';
import NarrationPlayer from './NarrationPlayer';
import { WIZARD_BUNNY_MASCOT_URL, BOTTOM_LEFT_WIZARD_BUNNY_URL } from '../constants';
import { GeneratedStoryContent } from '../types';

interface OutputPageProps {
  storyContent: GeneratedStoryContent | null;
  onRestart: () => void;
}

const OutputPage: React.FC<OutputPageProps> = ({ storyContent, onRestart }) => {
  if (!storyContent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-600">
        <p>No story content available. Please go back and create a story.</p>
        <button onClick={onRestart} className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg">
          Create New Story
        </button>
      </div>
    );
  }

  return (
    <div
      // The page itself is the only scroll container - no nested `overflow-y-auto`
      // and no fixed heights, so the browser scrolls this naturally instead of
      // fighting between three stacked scroll areas.
      className="relative flex flex-col items-center py-8 my-8 rounded-3xl shadow-xl max-w-3xl w-full mx-8 sm:mx-auto"
      style={{ backgroundColor: '#fdf7e3' }}
    >
      {/* Top-right Wizard Bunny Mascot */}
      <img
        src={WIZARD_BUNNY_MASCOT_URL}
        alt="Wizard Bunny Mascot"
        className="absolute top-[-10px] right-[-10px] w-32 h-32 object-contain rounded-full shadow-lg lg:block hidden z-20"
      />

      {/* Bottom-left Wizard Bunny Mascot */}
      <img
        src={BOTTOM_LEFT_WIZARD_BUNNY_URL}
        alt="Bottom-left Wizard Bunny Mascot"
        className="absolute bottom-[-10px] left-[-10px] w-32 h-32 object-contain rounded-full shadow-lg lg:block hidden z-20"
      />

      <h2 className="text-4xl font-extrabold text-purple-700 mb-6 text-center px-6 z-10">
        Your Enchanted Story Awaits!
      </h2>

      {/* Decorative frame for the story (grows with the text; the page scrolls) */}
      <div className="relative w-full px-4 sm:px-6 z-10 mb-8">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-2 rounded-2xl shadow-inner border-4 border-yellow-300">
          {/* Inner frame for more decorative feel */}
          <div className="bg-white/90 p-6 rounded-xl border border-yellow-200">
            <h3 className="text-3xl font-bold text-gray-800 mb-4 text-center">
              {storyContent.title}
            </h3>
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
              {storyContent.story}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 w-full px-4 sm:px-6 z-10">
        <h3 className="text-xl font-semibold text-purple-600 mb-3 text-center">Listen to the Narration:</h3>
        <NarrationPlayer text={storyContent.story} pitch={storyContent.pitch} />
      </div>

      {/* Moral of the Story section */}
      {storyContent.moral && (
        <div className="text-center bg-yellow-100 p-4 mx-4 sm:mx-6 rounded-lg border border-yellow-300 shadow-sm z-10">
          <p className="text-gray-700 text-lg font-semibold">
            Moral of the Story: <span className="font-normal italic">{storyContent.moral}</span>
          </p>
        </div>
      )}

      {/* Moved "Create Another" button here */}
      <button
        onClick={onRestart}
        className="flex items-center justify-center gap-2 px-8 py-4 text-xl font-bold rounded-full bg-blue-400 text-white shadow-xl hover:bg-blue-500 transition-all duration-300 active:scale-98 focus:outline-none focus:ring-2 focus:ring-blue-300 z-10 mt-8"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
        </svg>
        Create Another
      </button>
    </div>
  );
};

export default OutputPage;
