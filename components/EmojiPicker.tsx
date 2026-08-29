
import React, { useMemo, useState } from 'react';
import { splitEmojis } from '../utils';

interface EmojiPickerProps {
  /** Current emoji string (kept in sync with the text input). */
  value: string;
  /** Called with the next emoji string whenever the selection changes. */
  onChange: (next: string) => void;
  /** Maximum number of emoji that may be selected. */
  max: number;
}

const CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Animals',
    emojis: ['🦁', '🐯', '🐻', '🐼', '🐨', '🦊', '🐰', '🐶', '🐱', '🐵', '🐸', '🦉', '🦄', '🐢', '🐍', '🐙', '🐳', '🐬', '🦋', '🐝'],
  },
  {
    name: 'Nature',
    emojis: ['🌈', '🌧️', '⛈️', '❄️', '🔥', '🌊', '🌙', '⭐', '☀️', '🌍', '🌲', '🌸', '🍄', '🌵', '🌟', '💧', '🌪️', '🏔️'],
  },
  {
    name: 'Faces',
    emojis: ['😀', '😂', '😍', '😎', '🤔', '😴', '😱', '😭', '😡', '🤩', '😇', '🥳', '😬', '🤫', '😅', '🙄'],
  },
  {
    name: 'Magic',
    emojis: ['🧙', '🧚', '🐉', '👑', '⚔️', '🛡️', '🏰', '💎', '🪄', '📜', '🗝️', '👻', '🎃', '💀', '🧜', '🧞'],
  },
  {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🎮', '🎨', '🎵', '🎤', '📚', '🚀', '🎪', '🎭', '🏆', '🎯', '🪁', '🎸', '🏕️', '🎈'],
  },
  {
    name: 'Things',
    emojis: ['💡', '🔑', '💰', '🎁', '📷', '⏰', '🧭', '🔮', '🕯️', '🗺️', '✉️', '🎒', '☂️', '🔔'],
  },
  {
    name: 'Food',
    emojis: ['🍎', '🍌', '🍓', '🍕', '🍔', '🍦', '🍩', '🍪', '🎂', '🍿', '🍭', '🥕', '🧀', '🍯'],
  },
  {
    name: 'Travel',
    emojis: ['🚗', '✈️', '🚂', '🚢', '🚁', '🚲', '🏝️', '🗻', '🌋', '🏜️', '🎡', '🗽', '⛺', '🚀'],
  },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ value, onChange, max }) => {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].name);

  const selected = useMemo(() => splitEmojis(value), [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const isFull = selected.length >= max;

  const toggle = (emoji: string) => {
    if (selectedSet.has(emoji)) {
      onChange(selected.filter((e) => e !== emoji).join(''));
    } else if (!isFull) {
      onChange([...selected, emoji].join(''));
    }
  };

  const category = CATEGORIES.find((c) => c.name === activeCategory) ?? CATEGORIES[0];

  return (
    <div className="w-full rounded-2xl border-2 border-orange-200 bg-white/70 p-3 shadow-inner">
      {/* Category tabs */}
      <div className="mb-3 flex flex-wrap justify-center gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => setActiveCategory(c.name)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300
              ${c.name === activeCategory
                ? 'bg-orange-400 text-white shadow'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        {category.emojis.map((emoji) => {
          const isSelected = selectedSet.has(emoji);
          const isDisabled = !isSelected && isFull;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              aria-label={isSelected ? `Remove ${emoji}` : `Add ${emoji}`}
              className={`flex h-10 items-center justify-center rounded-xl text-2xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-300
                ${isSelected
                  ? 'bg-green-200 ring-2 ring-green-400 scale-105'
                  : isDisabled
                    ? 'cursor-not-allowed opacity-30'
                    : 'bg-gray-50 hover:scale-110 hover:bg-yellow-100'
                }`}
            >
              {emoji}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-center text-xs font-semibold text-gray-400">
        {isFull
          ? `That's ${max} - tap a highlighted emoji to swap it out`
          : 'Tap to add · tap again to remove'}
      </p>
    </div>
  );
};

export default EmojiPicker;
