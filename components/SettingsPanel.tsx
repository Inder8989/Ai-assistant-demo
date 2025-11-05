import React, { useState } from 'react';

interface SettingsPanelProps {
  apiKey: string;
  onApiKeySave: (key: string) => void;
  voiceId: string;
  onVoiceIdChange: (id: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ apiKey, onApiKeySave }) => {
  const [currentApiKey, setCurrentApiKey] = useState(apiKey);
  const [saveStatus, setSaveStatus] = useState('');

  const handleSave = () => {
    onApiKeySave(currentApiKey);
    setSaveStatus('API Key saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-brand-secondary p-4 md:p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-brand-text">Configure your API keys and preferences.</p>
      </header>
      
      <div className="max-w-md space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">ElevenLabs Text-to-Speech</h3>
          <p className="text-sm text-brand-text mb-4">
            This API key can be used for other text-to-speech features in the application. It is stored securely in your browser's local storage.
          </p>
          <label htmlFor="elevenlabs-key" className="block text-sm font-medium mb-1">API Key</label>
          <div className="flex gap-2">
            <input
              id="elevenlabs-key"
              type="password"
              value={currentApiKey}
              onChange={(e) => setCurrentApiKey(e.target.value)}
              placeholder="Enter your ElevenLabs API key"
              className="flex-1 p-2 bg-brand-primary rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-brand-accent text-white font-bold rounded-md hover:bg-sky-400 transition-colors"
            >
              Save
            </button>
          </div>
          {saveStatus && <p className="text-green-400 text-sm mt-2">{saveStatus}</p>}
        </div>
      </div>
    </div>
  );
};
