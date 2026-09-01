
import { StoryMode } from './types';

export const MIN_EMOJIS = 3;
export const MAX_EMOJIS = 5;
export const WIZARD_BUNNY_MASCOT_URL = 'https://thumbs.dreamstime.com/b/cartoon-bunny-glasses-reading-book-digital-art-ai-generated-cartoon-bunny-glasses-reading-book-291322962.jpg'; // New URL for Wizard Bunny
// New URL for the bottom-left Wizard Bunny mascot, using the same image as the top-right
export const BOTTOM_LEFT_WIZARD_BUNNY_URL = 'https://thumbs.dreamstime.com/b/cartoon-bunny-glasses-reading-book-digital-art-ai-generated-cartoon-bunny-glasses-reading-book-291322962.jpg';
export const EMOJI_ORACLE_BOOK_URL = 'https://rabbitmarketinghouse.in/webinar/assets/Untitled_design__9_-removebg-preview.png'; // Updated URL for the Emoji Oracle book
export const MAGIC_BANNER_URL = 'https://i.imgur.com/g1fBf0I.png'; // New URL for the wavy "Create Your Masterpiece!" banner image

// Narration is spoken with the browser's built-in Web Speech API (speechSynthesis).
// `tone` nudges the default voice per story mode; `rate` is the speaking speed.
export const NARRATION_RATE = 0.95;

// OpenRouter model used for story generation. Override with OPENROUTER_MODEL in .env.local.
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'minimax/minimax-m3:free';

interface ModeConfig {
  systemInstruction: string;
  // Pitch multiplier (1 = default) for the narration voice, giving each mode its own feel.
  pitch: number;
}

// Config for different story modes
export const MODEL_CONFIG_BY_MODE: Record<StoryMode, ModeConfig | undefined> = {
  [StoryMode.Love]: {
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into heartwarming, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    pitch: 1.15, // gentle, friendly
  },
  [StoryMode.Fantasy]: {
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into epic, magical, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    pitch: 1.1, // enchanting, light
  },
  [StoryMode.Spooky]: {
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into spooky but child-friendly, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    pitch: 0.8, // deeper, mysterious
  },
  [StoryMode.SciFi]: {
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into adventurous, sci-fi, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    pitch: 1.0, // adventurous, clear
  },
};

export const DEFAULT_NARRATION_PITCH = 1.0;