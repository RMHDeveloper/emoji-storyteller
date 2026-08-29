// Emoji-string helpers.
//
// Emoji are frequently made of several code points - variation selectors (️),
// skin-tone modifiers (🏽), and ZWJ sequences (👨‍👩‍👧). Counting UTF-16 code
// units or naive regex matches splits those into many "emoji" and wrongly
// rejects valid input. We segment into grapheme clusters instead and keep the
// ones that contain a pictographic / regional-indicator code point.

const EMOJI_LIKE = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

const EMOJI_SEQUENCE =
  /\p{Extended_Pictographic}(‍\p{Extended_Pictographic}|[️\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}])*|\p{Regional_Indicator}{2}/gu;

type SegmenterCtor = new (
  locales?: string | string[],
  options?: { granularity?: 'grapheme' | 'word' | 'sentence' },
) => { segment(input: string): Iterable<{ segment: string }> };

function getSegmenter(): SegmenterCtor | undefined {
  return (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter;
}

/** Split a string into individual user-perceived emoji, dropping everything else. */
export function splitEmojis(input: string): string[] {
  const text = input.trim();
  if (!text) return [];

  const Segmenter = getSegmenter();
  if (Segmenter) {
    const out: string[] = [];
    for (const { segment } of new Segmenter(undefined, { granularity: 'grapheme' }).segment(text)) {
      if (EMOJI_LIKE.test(segment)) out.push(segment);
    }
    return out;
  }

  return text.match(EMOJI_SEQUENCE) ?? [];
}

/** Count user-perceived emoji in a string. */
export function countEmojis(input: string): number {
  return splitEmojis(input).length;
}
