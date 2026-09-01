

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

// Structured story content returned by the model
export interface GeneratedStoryContent {
  title: string;
  story: string;
  moral?: string; // Moral of the story is optional
  pitch?: number; // Narration voice pitch for this story's mode
}