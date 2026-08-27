

export enum AppPage {
  Loading = 'Loading',
  Input = 'Input',
  Output = 'Output',
}

export enum StoryMode {
  Love = '💖 Love',
  Fantasy = '🦄 Fantasy',
  Spooky = '👻 Spooky',
  SciFi = '🚀 Sci-Fi',
}

export interface StoryGenerationParams {
  emojis: string;
  mode: StoryMode;
}

// New interface for structured story content from the model
export interface GeneratedStoryContent {
  title: string;
  story: string;
  moral?: string; // Moral of the story is optional
  voiceName?: string; // Add voiceName to store the TTS voice used for this story
}