
import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Loader } from './Loader';

export const ImageEditPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<{ file: File, previewUrl: string } | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalImage({ file, previewUrl: URL.createObjectURL(file) });
      setEditedImage(null);
    }
  };

  const handleEdit = async () => {
    if (!prompt.trim() || !originalImage) {
      setError('Please upload an image and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const { file } = originalImage;
      const base64Data = await fileToBase64(file);
      const imageUrl = await editImage(base64Data, file.type, prompt);
      setEditedImage(imageUrl);
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
        <h2 className="text-2xl font-bold text-white">Image Editing</h2>
        <p className="text-brand-text">Modify images with AI using text instructions.</p>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input and Original Image */}
        <div className="flex flex-col gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center bg-brand-primary rounded-lg border-2 border-dashed border-brand-accent/50 cursor-pointer hover:border-brand-accent transition-colors"
          >
            {originalImage ? (
              <img src={originalImage.previewUrl} alt="Original" className="max-w-full max-h-full object-contain rounded-md p-2" />
            ) : (
              <div className="text-center text-brand-text">
                <p>Click to upload an image</p>
                <p className="text-sm">(PNG, JPG, WEBP)</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a retro filter, remove the person in the background"
            className="w-full h-24 p-2 bg-brand-primary rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none"
          />
          <button
            onClick={handleEdit}
            disabled={isLoading || !originalImage}
            className="w-full py-3 bg-brand-accent text-white font-bold rounded-md hover:bg-sky-400 disabled:bg-gray-500 transition-colors"
          >
            {isLoading ? 'Editing...' : 'Edit Image'}
          </button>
           {error && <div className="p-2 text-sm text-red-400 bg-red-900/50 rounded-md">{error}</div>}
        </div>

        {/* Edited Image Display */}
        <div className="flex items-center justify-center bg-brand-primary rounded-lg p-4">
          {isLoading ? (
            <Loader />
          ) : editedImage ? (
            <img src={editedImage} alt="Edited" className="max-w-full max-h-full object-contain rounded-md" />
          ) : (
            <div className="text-center text-brand-text">
              <p>Your edited image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
