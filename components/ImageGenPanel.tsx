
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { Loader } from './Loader';

export const ImageGenPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      setGeneratedImage(imageUrl);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-secondary p-4 md:p-8">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Image Generation</h2>
        <p className="text-brand-text">Create stunning visuals with AI from a text description.</p>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        {/* Controls */}
        <div className="lg:w-1/3 flex flex-col gap-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A majestic lion wearing a crown, cinematic lighting"
              className="w-full h-32 p-2 bg-brand-primary rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
          </div>
           <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium mb-2">Aspect Ratio</label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="w-full p-2 bg-brand-primary rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none"
            >
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Standard (4:3)</option>
              <option value="3:4">Tall (3:4)</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 bg-brand-accent text-white font-bold rounded-md hover:bg-sky-400 disabled:bg-gray-500 transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
           {error && <div className="p-2 text-sm text-red-400 bg-red-900/50 rounded-md">{error}</div>}
        </div>

        {/* Image Display */}
        <div className="flex-1 flex items-center justify-center bg-brand-primary rounded-lg p-4">
          {isLoading ? (
            <Loader />
          ) : generatedImage ? (
            <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-md" />
          ) : (
            <div className="text-center text-brand-text">
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
