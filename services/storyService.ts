import { StoryGenerationParams, GeneratedStoryContent } from '../types';
import { MODEL_CONFIG_BY_MODE, OPENROUTER_MODEL } from '../constants';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error(
      'Missing OpenRouter API key. Set OPENROUTER_API_KEY in your .env.local file and restart the dev server.',
    );
  }
  return key;
}

const PROMPT_SUFFIX = `Respond with ONLY a single JSON object and nothing else. Escape every double quote that appears inside a string value. Use this exact shape:
{
  "title": "Story Title",
  "story": "The full story text goes here.",
  "moral": "The moral of the story."
}`;

function buildPrompt(emojis: string): string {
  return `Based on these emojis: ${emojis}, create a captivating, long-form story for children.
The story must be between 400-500 words, include rich dialogue, and conclude with a clear moral or lesson.
Ensure that each emoji provided is integrated as a significant plot point.
${PROMPT_SUFFIX}`;
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

// Smaller free models sometimes emit JSON with unescaped quotes inside the story
// text. Since we control the schema, pull the three known fields out directly
// when a strict parse fails.
function lenientExtract(raw: string): GeneratedStoryContent | null {
  const field = (key: string, nextKeys: string[]): string | undefined => {
    const boundary = nextKeys.length
      ? `(?:,\\s*"(?:${nextKeys.join('|')})"\\s*:|}\\s*$)`
      : `}\\s*$`;
    const m = raw.match(new RegExp(`"${key}"\\s*:\\s*"([\\s\\S]*?)"\\s*${boundary}`));
    return m ? unescapeJsonString(m[1]) : undefined;
  };

  const title = field('title', ['story', 'moral']);
  const story = field('story', ['moral', 'title']);
  const moral = field('moral', ['title', 'story']);

  if (title && story) return { title, story, moral };
  return null;
}

function parseStoryPayload(content: string): GeneratedStoryContent {
  let text = content.trim();

  // The model occasionally wraps JSON in a ```json ... ``` markdown fence.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) text = fenced[1].trim();

  // Trim anything before the first { / after the last }.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start > 0 || (end !== -1 && end < text.length - 1)) {
    text = text.slice(start === -1 ? 0 : start, end === -1 ? undefined : end + 1);
  }

  let parsed: GeneratedStoryContent | null = null;
  try {
    parsed = JSON.parse(text) as GeneratedStoryContent;
  } catch {
    parsed = lenientExtract(text);
  }

  if (!parsed || !parsed.title || !parsed.story) {
    throw new Error('unparseable');
  }

  // Models sometimes sprinkle markdown (**bold**, # headings) into the prose,
  // which OutputPage renders as literal text. Strip the common markers.
  const stripMarkdown = (s: string): string =>
    s
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/`([^`]*)`/g, '$1');

  return {
    title: stripMarkdown(parsed.title).trim(),
    story: stripMarkdown(parsed.story).trim(),
    moral: parsed.moral ? stripMarkdown(parsed.moral).trim() : undefined,
  };
}

async function requestStory(emojis: string, systemInstruction: string): Promise<GeneratedStoryContent> {
  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json',
        // Optional attribution headers OpenRouter uses for its dashboard.
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Emoji Storyteller',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: buildPrompt(emojis) },
        ],
        temperature: 0.8,
        top_p: 0.95,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });
  } catch (networkError) {
    console.error('OpenRouter request failed:', networkError);
    throw new Error('Could not reach OpenRouter. Check your connection and try again.');
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('OpenRouter error response:', response.status, detail);
    if (response.status === 401) {
      throw new Error('OpenRouter rejected the API key. Check OPENROUTER_API_KEY in .env.local.');
    }
    if (response.status === 402) {
      throw new Error('OpenRouter account is out of credits. Add credits at https://openrouter.ai/settings/credits.');
    }
    if (response.status === 429) {
      throw new Error('OpenRouter rate limit hit. Wait for the daily reset or add credits, then try again.');
    }
    throw new Error(`OpenRouter request failed (${response.status}). ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error('OpenRouter returned an empty response.');
  }
  return parseStoryPayload(content);
}

export async function generateStory(params: StoryGenerationParams): Promise<GeneratedStoryContent> {
  const modeConfig = MODEL_CONFIG_BY_MODE[params.mode];
  if (!modeConfig) {
    throw new Error(`Invalid story mode: ${params.mode}`);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await requestStory(params.emojis, modeConfig.systemInstruction);
      return { ...content, pitch: modeConfig.pitch };
    } catch (err) {
      lastError = err;
      // Only retry when the model returned something we couldn't parse.
      if (!(err instanceof Error) || err.message !== 'unparseable') break;
      console.warn(`Story parse failed (attempt ${attempt + 1}), retrying...`);
    }
  }

  if (lastError instanceof Error && lastError.message === 'unparseable') {
    throw new Error('The story generator returned an unreadable response. Please try again.');
  }
  throw lastError instanceof Error ? lastError : new Error('Story generation failed.');
}
