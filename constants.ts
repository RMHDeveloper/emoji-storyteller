
import { StoryMode } from './types';

export const MIN_EMOJIS = 3;
export const MAX_EMOJIS = 5;
export const WIZARD_BUNNY_MASCOT_URL = 'https://thumbs.dreamstime.com/b/cartoon-bunny-glasses-reading-book-digital-art-ai-generated-cartoon-bunny-glasses-reading-book-291322962.jpg'; // New URL for Wizard Bunny
// New URL for the bottom-left Wizard Bunny mascot, using the same image as the top-right
export const BOTTOM_LEFT_WIZARD_BUNNY_URL = 'https://thumbs.dreamstime.com/b/cartoon-bunny-glasses-reading-book-digital-art-ai-generated-cartoon-bunny-glasses-reading-book-291322962.jpg';
export const EMOJI_ORACLE_BOOK_URL = 'https://rabbitmarketinghouse.in/webinar/assets/Untitled_design__9_-removebg-preview.png'; // Updated URL for the Emoji Oracle book
export const MAGIC_BANNER_URL = 'https://i.imgur.com/g1fBf0I.png'; // New URL for the wavy "Create Your Masterpiece!" banner image

// Audio parameters
export const AUDIO_SAMPLE_RATE = 24000; // Gemini TTS output sample rate
export const AUDIO_CHANNELS = 1;
export const AUDIO_PLAYBACK_RATE = 1.0; // Storyteller speed adjusted to normal (1.0) for faster perception

// Model mapping for different story modes
export const MODEL_CONFIG_BY_MODE: Record<StoryMode, { model: string; systemInstruction: string; voiceName: string } | undefined> = {
  [StoryMode.Love]: {
    model: 'gemini-3-flash-preview', // Changed to flash for speed
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into heartwarming, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    voiceName: 'Puck' // Chosen for a gentle, friendly tone
  },
  [StoryMode.Fantasy]: {
    model: 'gemini-3-flash-preview', // Changed to flash for speed
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into epic, magical, long-form stories. Write approximately 400-500 words. Include lots. of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    voiceName: 'Zephyr' // Chosen for an enchanting, light tone
  },
  [StoryMode.Spooky]: {
    model: 'gemini-3-flash-preview',
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into spooky but child-friendly, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    voiceName: 'Charon' // Chosen for a deeper, slightly mysterious tone
  },
  [StoryMode.SciFi]: {
    model: 'gemini-3-flash-preview', // Changed to flash for speed
    systemInstruction: 'You are a professional children\'s audiobook narrator and the "Emoji Wizard." You turn emojis into adventurous, sci-fi, long-form stories. Write approximately 400-500 words. Include lots of dialogue and a moral of the story. Ensure every emoji is a major plot point.',
    voiceName: 'Fenrir' // Chosen for a more adventurous, clear tone
  },
};

// General TTS model (now only for default, specific modes will override)
export const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
export const TTS_VOICE_NAME = 'Kore'; // Default voice if not specified by mode