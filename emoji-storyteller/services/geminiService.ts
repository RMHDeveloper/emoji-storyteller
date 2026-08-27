
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { StoryGenerationParams, StoryMode, GeneratedStoryContent } from '../types';
import {
  AUDIO_SAMPLE_RATE,
  AUDIO_CHANNELS,
  MODEL_CONFIG_BY_MODE,
  TTS_MODEL,
  TTS_VOICE_NAME,
} from '../constants';

// Helper functions for audio decoding/encoding as per Gemini guidelines
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  // Fix: Declare bytes array
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Fix: Update generateStory to return a structured GeneratedStoryContent object
export async function generateStory(params: StoryGenerationParams): Promise<GeneratedStoryContent> {
  // Always create a new GoogleGenAI instance before making an API call
  // to ensure it uses the most up-to-date API key from the dialog.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const modeConfig = MODEL_CONFIG_BY_MODE[params.mode];
  if (!modeConfig) {
    throw new Error(`Invalid story mode: ${params.mode}`);
  }

  // Updated prompt to explicitly request JSON output with title, story, and moral
  const prompt = `Based on these emojis: ${params.emojis}, create a captivating, long-form story for children.
  The story must be between 400-500 words, include rich dialogue, and conclude with a clear moral or lesson.
  Ensure that each emoji provided is integrated as a significant plot point.
  Respond strictly in JSON format with the following structure:
  {
    "title": "Story Title",
    "story": "The full story text goes here.",
    "moral": "The moral of the story."
  }`;

  const response = await ai.models.generateContent({
    model: modeConfig.model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: modeConfig.systemInstruction,
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      // Increased max output tokens to accommodate 400-500 words + JSON overhead
      maxOutputTokens: 1024, 
      thinkingConfig: { thinkingBudget: 0 }, // Disabled thinking budget for faster response
      // Fix: Request JSON response with a defined schema
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'The title of the generated story.',
          },
          story: {
            type: Type.STRING,
            description: 'The full text of the generated story.',
          },
          moral: {
            type: Type.STRING,
            description: 'The moral or lesson learned from the story.',
          },
        },
        required: ["title", "story"], // title and story are mandatory, moral is optional
        propertyOrdering: ["title", "story", "moral"],
      },
    },
  });

  const jsonString = response.text?.trim();
  if (!jsonString) {
    throw new Error('Failed to generate story content or received an empty JSON response.');
  }

  try {
    const parsedContent: GeneratedStoryContent = JSON.parse(jsonString);
    if (!parsedContent.title || !parsedContent.story) {
        throw new Error('Generated JSON is missing required fields (title or story).');
    }
    // Add voiceName to the returned content for use in textToSpeech
    // Fix: voiceName is now part of GeneratedStoryContent, so it can be assigned directly.
    return { ...parsedContent, voiceName: modeConfig.voiceName };
  } catch (parseError) {
    console.error('Failed to parse story JSON:', jsonString, parseError);
    throw new Error('Failed to parse generated story content. The model might not have returned valid JSON.');
  }
}

// Updated textToSpeech to accept an optional voiceName parameter
export async function textToSpeech(text: string, voiceName: string = TTS_VOICE_NAME): Promise<AudioBuffer> {
  // Always create a new GoogleGenAI instance before making an API call
  // to ensure it uses the most up-to-date API key from the dialog.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: TTS_MODEL,
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voiceName }, // Use the provided voiceName
        },
      },
    },
  });

  const base64EncodedAudioString =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!base64EncodedAudioString) {
    throw new Error('Failed to generate audio data.');
  }

  // Fix: Use AudioContext directly, webkitAudioContext is deprecated.
  const outputAudioContext = new AudioContext({ sampleRate: AUDIO_SAMPLE_RATE });

  const audioBuffer = await decodeAudioData(
    decode(base64EncodedAudioString),
    outputAudioContext,
    AUDIO_SAMPLE_RATE,
    AUDIO_CHANNELS,
  );

  return audioBuffer;
}