import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { ImageGenPanel } from './components/ImageGenPanel';
import { ImageEditPanel } from './components/ImageEditPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { Header } from './components/Header';
import { Feature } from './types';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.CHAT);
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>('sk_b8455a7fa8b89d7a39bf326415b80e4d69f4a9230d6211f7');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState<string>('ErXwobaYiN019PkySvjV'); // Default: Antoni (for Jarvis)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  useEffect(() => {
    // This allows user to override the key in settings
    const storedKey = localStorage.getItem('elevenLabsApiKey');
    if (storedKey) {
      setElevenLabsApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleApiKeySave = (key: string) => {
    setElevenLabsApiKey(key);
    localStorage.setItem('elevenLabsApiKey', key);
  };

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case Feature.CHAT:
        return <ChatPanel />;
      case Feature.IMAGE_GEN:
        return <ImageGenPanel />;
      case Feature.IMAGE_EDIT:
        return <ImageEditPanel />;
      case Feature.SETTINGS:
        return (
          <SettingsPanel
            apiKey={elevenLabsApiKey}
            onApiKeySave={handleApiKeySave}
            voiceId={elevenLabsVoiceId}
            onVoiceIdChange={setElevenLabsVoiceId}
          />
        );
      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-brand-primary text-brand-text font-sans">
      <Sidebar 
        activeFeature={activeFeature} 
        setActiveFeature={setActiveFeature}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          activeFeature={activeFeature}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 flex flex-col">
          {renderActiveFeature()}
        </main>
      </div>
    </div>
  );
};

export default App;