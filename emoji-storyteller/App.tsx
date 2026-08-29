
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Import GeneratedStoryContent from './types'
import { AppPage, StoryMode, GeneratedStoryContent } from './types';
import { generateStory, textToSpeech } from './services/geminiService';
import LoadingPage from './components/LoadingPage';
import InputPage from './components/InputPage';
import OutputPage from './components/OutputPage';
import { MIN_EMOJIS, MAX_EMOJIS, MODEL_CONFIG_BY_MODE } from './constants'; // Import MODEL_CONFIG_BY_MODE
import { countEmojis } from './utils';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.Loading);
  const [emojis, setEmojis] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<StoryMode | null>(null);
  const [storyContent, setStoryContent] = useState<GeneratedStoryContent | null>(null); // Changed type
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  // Simplified status text to a single string as per the new loading page design
  const [currentLoadingStatus, setCurrentLoadingStatus] = useState<string>('Consulting the Emoji Oracle...');
  const [showStartButton, setShowStartButton] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial app loading simulation - made almost instant
  useEffect(() => {
    setLoadingProgress(0);
    setShowStartButton(false);
    
    // Simulate initial loading phase (0% to 100% for the single progress bar)
    // This part is now much faster.
    setCurrentLoadingStatus('Preparing the magic...');
    setTimeout(() => {
      setLoadingProgress(100);
      setCurrentLoadingStatus('Adventure Awaits!');
      setShowStartButton(true);
      setLoadingProgress(0); // Reset for potential later generation phases
    }, 200); // Very short delay
  }, []);

  // Effect to manage body background based on currentPage
  useEffect(() => {
    const starryBackgroundUrl = 'url(\'https://png.pngtree.com/background/20250729/original/pngtree-an-amazing-pastel-sky-with-fluffy-cloud-and-starry-background-in-picture-image_16403793.jpg\')';
    const creamBackgroundColor = '#fdf7e3'; // Updated to match OutputPage background

    if (currentPage === AppPage.Loading) {
      document.body.style.backgroundImage = starryBackgroundUrl;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundColor = 'transparent'; // Ensure no solid color interferes
    } else if (currentPage === AppPage.Input || currentPage === AppPage.Output) {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = creamBackgroundColor;
    }
  }, [currentPage]);


  const handleStartClick = useCallback(() => {
    setCurrentPage(AppPage.Input);
    setShowStartButton(false);
    setError(null);
  }, []);

  const handleEmojisChange = useCallback((newEmojis: string) => {
    setEmojis(newEmojis);
  }, []);

  const handleModeSelect = useCallback((mode: StoryMode) => {
    setSelectedMode(mode);
  }, []);

  const handleCreateStory = useCallback(async () => {
    const emojiCount = countEmojis(emojis);
    if (emojiCount < MIN_EMOJIS || emojiCount > MAX_EMOJIS) {
      setError(`Please enter between ${MIN_EMOJIS} and ${MAX_EMOJIS} emojis.`);
      return;
    }
    if (!selectedMode) {
      setError('Please select a story mode.');
      return;
    }

    setError(null);
    setCurrentPage(AppPage.Loading);
    setLoadingProgress(0);
    setCurrentLoadingStatus('Crafting your magical story...'); // New status for story generation
    setStoryContent(null); // Reset story content
    setAudioBuffer(null);
    setShowStartButton(false);

    try {
      // Step 1: Generate Story
      setLoadingProgress(20); // Initial progress for story generation
      const generatedContent: GeneratedStoryContent = await generateStory({ emojis, mode: selectedMode });
      setStoryContent(generatedContent);
      setLoadingProgress(70); // Progress after story text is generated
      setCurrentLoadingStatus('Generating heartwarming narration...'); // New status for audio generation
      
      const voiceToUse = generatedContent.voiceName;

      // Step 2: Generate Audio from the story content
      const generatedAudioBuffer = await textToSpeech(generatedContent.story, voiceToUse); // Pass voiceToUse
      setAudioBuffer(generatedAudioBuffer);
      setLoadingProgress(100); // Progress after audio is generated

      // Removed the setTimeout for instant transition
      setCurrentPage(AppPage.Output);
    } catch (err: any) {
      console.error('Story generation error:', err);
      setError(err.message || 'An unexpected error occurred during story generation.');
      setCurrentPage(AppPage.Input);
      setLoadingProgress(0); // Reset progress on error
      setShowStartButton(false);
      setCurrentLoadingStatus('Consulting the Emoji Oracle...'); // Reset status on error
    }
  }, [emojis, selectedMode]);

  const handleRestart = useCallback(() => {
    setEmojis('');
    setSelectedMode(null);
    setStoryContent(null); // Reset story content
    setAudioBuffer(null);
    setError(null);
    setLoadingProgress(0);
    setShowStartButton(false);
    setCurrentPage(AppPage.Input);
    setCurrentLoadingStatus('Consulting the Emoji Oracle...'); // Reset status on restart
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen w-full"> {/* Changed: Removed p-4 and justify-center */}
      {currentPage === AppPage.Loading && (
        <LoadingPage
          progress={loadingProgress} // Progress is still managed internally, but bar is hidden
          statusText={currentLoadingStatus} // Pass dynamic status text
          showStartButton={showStartButton}
          onStartClick={handleStartClick}
        />
      )}
      {currentPage === AppPage.Input && (
        <InputPage
          emojis={emojis}
          selectedMode={selectedMode}
          onEmojisChange={handleEmojisChange}
          onModeSelect={handleModeSelect}
          onCreateStory={handleCreateStory}
          error={error}
        />
      )}
      {currentPage === AppPage.Output && (
        <OutputPage storyContent={storyContent} audioBuffer={audioBuffer} onRestart={handleRestart} />
      )}
      {/* Removed global <style> block as its rules are either obsolete or handled dynamically */}
    </div>
  );
};

export default App;