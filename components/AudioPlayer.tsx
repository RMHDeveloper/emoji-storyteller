
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AUDIO_PLAYBACK_RATE } from '../constants';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
}

const formatTime = (timeInSeconds: number): string => {
  const safe = Number.isFinite(timeInSeconds) && timeInSeconds > 0 ? timeInSeconds : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  // Committed position - only updated at discrete events (play/pause/seek/end),
  // never per-frame. It seeds the DOM on re-render; the rAF loop paints between.
  const [displayTime, setDisplayTime] = useState<number>(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0); // audioContext.currentTime when the current segment started
  const pausedAtRef = useRef<number>(0); // logical (displayed) time when playback last started/resumed
  const currentTimeRef = useRef<number>(0); // live logical playback position

  const durationRef = useRef(duration);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // The progress bar and time label are updated by writing to the DOM directly
  // from the rAF loop. Driving them through React state instead re-rendered the
  // component ~60x/s, which made the whole panel flicker during playback.
  //
  // The fill is animated with `transform: scaleX()` (GPU-composited, no layout)
  // rather than `width` (triggers layout every frame -> the page wobbled while
  // scrolling). The time label is only rewritten when the whole second changes.
  const fillRef = useRef<HTMLDivElement | null>(null);
  const currentLabelRef = useRef<HTMLSpanElement | null>(null);
  const lastLabelSecondRef = useRef<number>(-1);

  const paint = useCallback((time: number) => {
    const total = durationRef.current;
    const ratio = total > 0 ? Math.min(Math.max(time / total, 0), 1) : 0;
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${ratio})`;

    const whole = Math.floor(time);
    if (currentLabelRef.current && whole !== lastLabelSecondRef.current) {
      lastLabelSecondRef.current = whole;
      currentLabelRef.current.textContent = formatTime(time);
    }
  }, []);

  // commit: also push to React state (for events, not per-frame updates).
  const setPosition = useCallback((time: number, commit = false) => {
    currentTimeRef.current = time;
    paint(time);
    if (commit) setDisplayTime(time);
  }, [paint]);

  const cancelProgressLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Tear down the active source WITHOUT letting its `onended` handler run app logic.
  // (source.stop() dispatches `ended` asynchronously; if that handler still points at
  //  our reset logic it clobbers the pause/seek position.)
  const teardownSource = useCallback(() => {
    const source = sourceNodeRef.current;
    if (source) {
      source.onended = null;
      try { source.stop(); } catch { /* already stopped */ }
      source.disconnect();
      sourceNodeRef.current = null;
    }
  }, []);

  // Initialize / reset when a new audioBuffer arrives.
  useEffect(() => {
    if (audioBuffer) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      setDuration(audioBuffer.duration);
      durationRef.current = audioBuffer.duration;
      setIsPlaying(false);

      teardownSource();
      pausedAtRef.current = 0;
      playbackStartTimeRef.current = 0;
      cancelProgressLoop();
      setPosition(0, true);
    }

    return () => {
      teardownSource();
      cancelProgressLoop();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => { /* noop */ });
        audioContextRef.current = null;
      }
    };
  }, [audioBuffer, teardownSource, cancelProgressLoop, setPosition]);

  const updateProgressBar = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !sourceNodeRef.current) {
      cancelProgressLoop();
      return;
    }

    const elapsed = (ctx.currentTime - playbackStartTimeRef.current) * AUDIO_PLAYBACK_RATE;
    const time = pausedAtRef.current + elapsed;
    const total = durationRef.current;

    if (time < total) {
      setPosition(time);
      animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    } else {
      // Reached the natural end of playback.
      setPosition(total, true);
      pausedAtRef.current = 0;
      playbackStartTimeRef.current = 0;
      teardownSource();
      cancelProgressLoop();
      setIsPlaying(false);
    }
  }, [cancelProgressLoop, teardownSource, setPosition]);

  const startPlayback = useCallback((startOffset: number) => {
    const ctx = audioContextRef.current;
    if (!audioBuffer || !ctx) return;

    // Browsers create the context in a "suspended" state until a user gesture.
    if (ctx.state === 'suspended') ctx.resume().catch(() => { /* noop */ });

    teardownSource();
    cancelProgressLoop();

    const total = audioBuffer.duration;
    const clampedOffset = Math.max(0, Math.min(startOffset, total));

    const newSource = ctx.createBufferSource();
    newSource.buffer = audioBuffer;
    newSource.connect(ctx.destination);
    newSource.playbackRate.value = AUDIO_PLAYBACK_RATE;
    newSource.start(0, clampedOffset / AUDIO_PLAYBACK_RATE);

    playbackStartTimeRef.current = ctx.currentTime;
    pausedAtRef.current = clampedOffset;

    // Only fires for a natural end here - deliberate stops null this out first.
    newSource.onended = () => {
      if (sourceNodeRef.current !== newSource) return;
      sourceNodeRef.current = null;
      pausedAtRef.current = 0;
      playbackStartTimeRef.current = 0;
      cancelProgressLoop();
      setPosition(durationRef.current, true);
      setIsPlaying(false);
    };

    sourceNodeRef.current = newSource;
    setPosition(clampedOffset, true);
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgressBar);
  }, [audioBuffer, cancelProgressLoop, teardownSource, updateProgressBar, setPosition]);

  const pauseAudio = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!sourceNodeRef.current || !ctx) return;

    const elapsed = (ctx.currentTime - playbackStartTimeRef.current) * AUDIO_PLAYBACK_RATE;
    pausedAtRef.current = Math.min(pausedAtRef.current + elapsed, durationRef.current);

    teardownSource();
    cancelProgressLoop();
    setPosition(pausedAtRef.current, true);
    setIsPlaying(false);
  }, [cancelProgressLoop, teardownSource, setPosition]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else if (currentTimeRef.current >= duration) {
      startPlayback(0);
    } else {
      startPlayback(currentTimeRef.current);
    }
  }, [isPlaying, duration, pauseAudio, startPlayback]);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer) return;
    const bar = e.currentTarget;
    const percent = (e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth;
    startPlayback(Math.max(0, Math.min(duration * percent, duration)));
  }, [audioBuffer, duration, startPlayback]);

  const skipAmount = 10; // seconds

  const rewindAudio = useCallback(() => {
    startPlayback(Math.max(0, currentTimeRef.current - skipAmount));
  }, [startPlayback]);

  const fastForwardAudio = useCallback(() => {
    startPlayback(Math.min(duration, currentTimeRef.current + skipAmount));
  }, [duration, startPlayback]);

  if (!audioBuffer) {
    return null;
  }

  const displayRatio = duration > 0 ? Math.min(Math.max(displayTime / duration, 0), 1) : 0;

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md w-full max-w-lg mx-auto">
      {/* Progress bar and time */}
      <div className="flex justify-between w-full text-sm text-gray-600 mb-2 tabular-nums">
        <span ref={currentLabelRef}>{formatTime(displayTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer mb-4 overflow-hidden" onClick={handleProgressBarClick}>
        <div
          ref={fillRef}
          className="absolute left-0 top-0 h-full w-full bg-yellow-500 rounded-full origin-left will-change-transform"
          style={{ transform: `scaleX(${displayRatio})` }}
        ></div>
      </div>

      {/* Controls - now includes rewind, play/pause, and fast forward buttons, centered */}
      <div className="flex items-center justify-center gap-6"> {/* Increased gap for visual separation */}
        <button
          onClick={rewindAudio}
          className="p-2 text-gray-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-full"
          aria-label="Rewind 10 seconds"
        >
          {/* Heroicon: Backward double arrow */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M10.707 4.293a1 1 0 010 1.414L8.414 8l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm6 0a1 1 0 010 1.414L14.414 8l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={togglePlayPause}
          className="p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? (
            // Pause Icon
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
          ) : (
            // Play Icon
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
            </svg>
          )}
        </button>
        <button
          onClick={fastForwardAudio}
          className="p-2 text-gray-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-full"
          aria-label="Fast forward 10 seconds"
        >
          {/* Heroicon: Forward double arrow */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M9.293 4.293a1 1 0 000 1.414L11.586 8l-2.293 2.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 00-1.414 0zm-6 0a1 1 0 000 1.414L5.586 8l-2.293 2.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 00-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
