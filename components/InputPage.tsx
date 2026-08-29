
import React from 'react';
import { MIN_EMOJIS, MAX_EMOJIS } from '../constants';
import { StoryMode } from '../types';
import { countEmojis } from '../utils';
import EmojiPicker from './EmojiPicker';

interface InputPageProps {
  onEmojisChange: (emojis: string) => void;
  onModeSelect: (mode: StoryMode) => void;
  onCreateStory: () => void;
  emojis: string;
  selectedMode: StoryMode | null;
  error: string | null;
}

const InputPage: React.FC<InputPageProps> = ({
  onEmojisChange,
  onModeSelect,
  onCreateStory,
  emojis,
  selectedMode,
  error,
}) => {
  const emojiCount = countEmojis(emojis);
  const isCountValid = emojiCount >= MIN_EMOJIS && emojiCount <= MAX_EMOJIS;

  const isValid = isCountValid && selectedMode !== null;

  const handleEmojisInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onEmojisChange(e.target.value);
  };

  return (
    <div
      className="relative flex flex-col items-center p-6 rounded-3xl shadow-xl max-w-2xl w-full mx-4 sm:mx-auto"
      style={{ backgroundColor: '#f4f1e8' }} // Updated color
    >
      
      {/* Removed "Create Your Masterpiece!" banner image */}

      {error && (
        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-3 rounded-lg mb-4 w-full text-center">
          {error}
        </div>
      )}

      <div className="w-full mb-4">
        {/* New image added here */}
        <img
          src="https://rabbitmarketinghouse.in/webinar/assets/creation.png"
          alt="Decorative element with stars and text 'Emoji Storyteller'"
          className="w-full md:w-3/5 h-auto object-contain mx-auto mb-4" // Centered and with bottom margin
        />
        <label htmlFor="emoji-input" className="text-xl font-bold text-gray-700 mb-2 block text-center">
          Your Emojis
        </label>
        <input
          id="emoji-input" // Added id for accessibility with label
          type="text"
          className="w-full p-4 border-2 border-orange-300 rounded-full focus:ring-4 focus:ring-yellow-300 focus:outline-none transition-all text-lg placeholder-gray-400 text-center shadow-lg"
          placeholder="Tap emojis below, or type your own…"
          value={emojis}
          onChange={handleEmojisInput}
          // maxLength is in UTF-16 code units, and a single emoji can be many of
          // them (skin tones, ZWJ families, flags). Keep it generous; the real
          // limit is the emoji count checked below.
          maxLength={MAX_EMOJIS * 16}
          // On mobile devices, clicking/tapping an input will automatically
          // bring up the system's virtual keyboard (typeboard).
          // No special JavaScript code is typically needed for this default browser behavior.
        />

        <div className="mt-4">
          <EmojiPicker value={emojis} onChange={onEmojisChange} max={MAX_EMOJIS} />
        </div>

        <div className="flex flex-col items-center gap-2 mt-4">
            {/* Emoji counter: current count / max, turns green once the count is valid */}
            <div
              className={`flex items-center justify-center w-20 h-20 rounded-full shadow-md border-2 transition-colors
                ${isCountValid
                  ? 'bg-green-200 border-green-300 text-green-800'
                  : 'bg-yellow-200 border-yellow-300 text-yellow-800'
                }`}
            >
                <span className="text-xl font-bold">{emojiCount}/{MAX_EMOJIS}</span>
            </div>
            <p className="text-sm font-semibold text-gray-500">
              {isCountValid
                ? 'Looks good!'
                : `Pick ${MIN_EMOJIS}–${MAX_EMOJIS} emojis`}
            </p>
        </div>
      </div>

      <div className="w-full mb-8">
        <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Mode Selection</h3>
        {/* Center alignment for mode buttons */}
        <div className="flex justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.values(StoryMode).map((mode) => (
              <button
                key={mode}
                onClick={() => onModeSelect(mode)}
                className={`flex flex-col items-center justify-center p-2 rounded-full h-24 w-24 text-sm font-bold shadow-lg transition-all duration-200 border
                  ${selectedMode === mode
                    ? 'scale-105 ring-2 ring-offset-2'
                    : 'bg-white border-gray-200 hover:scale-105 hover:shadow-xl'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-75 focus:ring-offset-2
                  ${mode === StoryMode.Love
                    ? selectedMode === mode ? 'bg-pink-100 border-pink-300 ring-pink-300 text-pink-800' : 'text-pink-700'
                    : ''
                  }
                  ${mode === StoryMode.Fantasy
                    ? selectedMode === mode ? 'bg-purple-100 border-purple-300 ring-purple-300 text-purple-800' : 'text-purple-700'
                    : ''
                  }
                  ${mode === StoryMode.Spooky
                    ? selectedMode === mode ? 'bg-green-100 border-green-300 ring-green-300 text-green-800' : 'text-green-700'
                    : ''
                  }
                  ${mode === StoryMode.SciFi
                    ? selectedMode === mode ? 'bg-blue-100 border-blue-300 ring-blue-300 text-blue-800' : 'text-blue-700'
                    : ''
                  }`}
              >
                <span className="text-4xl mb-1">{mode.split(' ')[0]}</span>
                <span className="text-xs text-gray-700">{mode.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onCreateStory}
        disabled={!isValid}
        className={`w-full py-4 text-2xl font-extrabold rounded-full shadow-2xl transition-all duration-300
          ${isValid
            ? 'bg-orange-400 text-white hover:bg-orange-500 active:scale-98'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-75`}
      >
        Create My Masterpiece
      </button>
    </div>
  );
};

export default InputPage;