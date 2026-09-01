
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NARRATION_RATE, DEFAULT_NARRATION_PITCH } from '../constants';

interface NarrationPlayerProps {
  text: string;
  pitch?: number;
}

const speechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

// Chrome stops speaking after ~15s on a single long utterance, so the story is
// broken into shorter chunks (sentence boundaries, capped length) that are
// spoken back-to-back.
const chunkText = (text: string): string[] => {
  const pieces = text.match(/[^.!?\n]+[.!?]*\s*|\n+/g) ?? [text];
  const chunks: string[] = [];
  let buffer = '';
  for (const piece of pieces) {
    if ((buffer + piece).length > 200 && buffer) {
      chunks.push(buffer);
      buffer = piece;
    } else {
      buffer += piece;
    }
  }
  if (buffer.trim()) chunks.push(buffer);
  return chunks.length ? chunks : [text];
};

const pickVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const lang = (navigator.language || 'en-US').toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase() === lang && v.localService) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en') && v.localService) ||
    voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
    voices[0]
  );
};

const NarrationPlayer: React.FC<NarrationPlayerProps> = ({ text, pitch = DEFAULT_NARRATION_PITCH }) => {
  const supported = useMemo(speechSupported, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ratio, setRatio] = useState(0);

  const chunks = useMemo(() => chunkText(text), [text]);
  const totalChars = useMemo(() => chunks.reduce((n, c) => n + c.length, 0), [chunks]);
  // Character count before each chunk, for computing overall progress.
  const offsets = useMemo(() => {
    const acc: number[] = [];
    let sum = 0;
    for (const c of chunks) {
      acc.push(sum);
      sum += c.length;
    }
    return acc;
  }, [chunks]);

  const chunkIndexRef = useRef(0);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!supported) return;
    const loadVoice = () => { voiceRef.current = pickVoice(); };
    loadVoice();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoice);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, [supported]);

  // Reset whenever the story text changes, and clean up on unmount.
  useEffect(() => {
    chunkIndexRef.current = 0;
    startedRef.current = false;
    setRatio(0);
    setIsPlaying(false);
    return () => { if (supported) window.speechSynthesis.cancel(); };
  }, [text, supported]);

  const speakFrom = useCallback((index: number) => {
    if (!supported || index >= chunks.length) {
      setIsPlaying(false);
      return;
    }
    chunkIndexRef.current = index;

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = NARRATION_RATE;
    utterance.pitch = pitch;
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
      utterance.lang = voiceRef.current.lang;
    }

    utterance.onboundary = (event) => {
      const spoken = offsets[index] + (event.charIndex || 0);
      setRatio(totalChars > 0 ? Math.min(spoken / totalChars, 1) : 0);
    };
    utterance.onend = () => {
      const next = chunkIndexRef.current + 1;
      if (next < chunks.length) {
        speakFrom(next);
      } else {
        setRatio(1);
        setIsPlaying(false);
        startedRef.current = false;
      }
    };
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [supported, chunks, offsets, totalChars, pitch]);

  const togglePlay = useCallback(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;

    if (isPlaying) {
      synth.pause();
      setIsPlaying(false);
      return;
    }
    // Finished (or not started) -> start from the beginning.
    if (!startedRef.current || ratio >= 1) {
      synth.cancel();
      startedRef.current = true;
      setRatio(0);
      speakFrom(0);
      return;
    }
    // Paused mid-story -> resume.
    if (synth.paused) {
      synth.resume();
      setIsPlaying(true);
    } else {
      speakFrom(chunkIndexRef.current);
    }
  }, [supported, isPlaying, ratio, speakFrom]);

  const restart = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    startedRef.current = true;
    setRatio(0);
    speakFrom(0);
  }, [supported, speakFrom]);

  if (!supported) {
    return (
      <p className="text-center text-gray-500 text-sm bg-white rounded-xl shadow-md p-4 max-w-lg mx-auto">
        Your browser doesn&apos;t support spoken narration. You can still read the story above.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md w-full max-w-lg mx-auto">
      <div className="relative w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full w-full bg-yellow-500 rounded-full origin-left will-change-transform transition-transform duration-150"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={restart}
          className="p-2 text-gray-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-full"
          aria-label="Restart narration"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={togglePlay}
          className="p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <div className="w-8" aria-hidden="true" />
      </div>
    </div>
  );
};

export default NarrationPlayer;
