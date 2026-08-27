
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AUDIO_PLAYBACK_RATE } from '../constants';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioBuffer }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0); // When audioContext.currentTime started playing the current segment
  const pausedAtRef = useRef<number>(0); // The logical time (displayed) when playback was paused or started

  // Ref to hold the latest isPlaying state to avoid stale closures in requestAnimationFrame loop
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Initialize AudioContext and source when audioBuffer changes
  useEffect(() => {
    if (audioBuffer) {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      setDuration(audioBuffer.duration);
      setCurrentTime(0);
      setIsPlaying(false); // Reset play state when new audio loads

      // Clean up previous source if it exists
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      pausedAtRef.current = 0; // Reset paused position
      playbackStartTimeRef.current = 0; // Reset playback start time

      // Stop any ongoing animation frame loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      // Cleanup on unmount
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioBuffer]);

  const updateProgressBar = useCallback(() => {
    // Use isPlayingRef.current for the latest state
    if (audioContextRef.current && isPlayingRef.current && sourceNodeRef.current) {
      // Calculate how much time has passed in the AudioContext since playbackStartTimeRef.current
      const timeElapsedSinceStartCall = audioContextRef.current.currentTime - playbackStartTimeRef.current;
      // Convert that elapsed time into logical audio time, considering playback rate
      const logicalTimeElapsed = timeElapsedSinceStartCall * AUDIO_PLAYBACK_RATE;
      // Add the logical time we were at when playback resumed
      const newCurrentTime = pausedAtRef.current + logicalTimeElapsed;

      setCurrentTime(Math.min(newCurrentTime, duration));

      if (newCurrentTime < duration) {
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      } else {
        // Playback finished, reset state
        setIsPlaying(false);
        setCurrentTime(duration);
        pausedAtRef.current = 0;
        playbackStartTimeRef.current = 0;
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    } else if (!isPlayingRef.current && animationFrameRef.current) { // If somehow still running while paused
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
  }, [duration]); // isPlaying is removed from dependencies because we use isPlayingRef.current

  const startPlayback = useCallback((startOffset: number) => { // startOffset is the logical time in seconds
    if (!audioBuffer || !audioContextRef.current) return;

    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    const newSource = audioContextRef.current.createBufferSource();
    newSource.buffer = audioBuffer;
    newSource.connect(audioContextRef.current.destination);
    newSource.playbackRate.value = AUDIO_PLAYBACK_RATE;

    const bufferOffset = startOffset / AUDIO_PLAYBACK_RATE; // Where to start in the audio buffer

    newSource.start(0, bufferOffset); // Play immediately from bufferOffset

    playbackStartTimeRef.current = audioContextRef.current.currentTime; // The exact audio context time when `start` was called
    pausedAtRef.current = startOffset; // The logical time (what's displayed) when we started/resumed

    newSource.onended = () => {
      setIsPlaying(false);
      setCurrentTime(duration);
      pausedAtRef.current = 0;
      playbackStartTimeRef.current = 0;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
      }
    };
    sourceNodeRef.current = newSource;
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateProgressBar);
  }, [audioBuffer, duration, updateProgressBar]);

  const playAudio = useCallback(() => {
    startPlayback(currentTime);
  }, [currentTime, startPlayback]);

  const pauseAudio = useCallback(() => {
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.stop();
      // Calculate current logical time at pause
      const timeElapsedSinceStartCall = audioContextRef.current.currentTime - playbackStartTimeRef.current;
      const logicalTimeElapsed = timeElapsedSinceStartCall * AUDIO_PLAYBACK_RATE;
      pausedAtRef.current = pausedAtRef.current + logicalTimeElapsed;
      
      setIsPlaying(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      if (currentTime >= duration) { // If at end, start from beginning
        startPlayback(0);
      } else {
        playAudio();
      }
    }
  };

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioBuffer) return;

    const progressBar = e.currentTarget;
    const clickX = e.clientX - progressBar.getBoundingClientRect().left;
    const percent = clickX / progressBar.offsetWidth;
    let newTime = duration * percent;

    // Ensure newTime is within bounds
    newTime = Math.max(0, Math.min(newTime, duration));
    
    startPlayback(newTime);

  }, [audioBuffer, duration, startPlayback]);

  const skipAmount = 10; // seconds

  const rewindAudio = useCallback(() => {
    let newTime = currentTime - skipAmount;
    newTime = Math.max(0, newTime); // Don't go below 0
    startPlayback(newTime);
  }, [currentTime, startPlayback]);

  const fastForwardAudio = useCallback(() => {
    let newTime = currentTime + skipAmount;
    newTime = Math.min(duration, newTime); // Don't go beyond duration
    startPlayback(newTime);
  }, [currentTime, duration, startPlayback]);


  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioBuffer) {
    return null;
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md w-full max-w-lg mx-auto">
      {/* Progress bar and time */}
      <div className="flex justify-between w-full text-sm text-gray-600 mb-2">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="relative w-full h-2 bg-gray-200 rounded-full cursor-pointer mb-4 overflow-hidden" onClick={handleProgressBarClick}>
        <div
          className="absolute h-full bg-yellow-500 rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${progressPercent}%` }}
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