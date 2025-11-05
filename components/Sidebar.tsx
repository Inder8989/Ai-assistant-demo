import React from 'react';
import { Feature } from '../types';
import { ChatIcon, ImageIcon, EditIcon, SettingsIcon, CloseIcon } from './icons';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavItem: React.FC<{
  feature: Feature;
  activeFeature: Feature;
  onClick: (feature: Feature) => void;
  children: React.ReactNode;
}> = ({ feature, activeFeature, onClick, children }) => (
  <button
    onClick={() => onClick(feature)}
    className={`flex items-center space-x-3 w-full p-3 rounded-lg text-left transition-all duration-200 ${
      activeFeature === feature
        ? 'bg-brand-accent text-white'
        : 'text-brand-text hover:bg-brand-secondary'
    }`}
    aria-current={activeFeature === feature}
  >
    {children}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature, isOpen, setIsOpen }) => {
  const handleFeatureSelect = (feature: Feature) => {
    setActiveFeature(feature);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };
  
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-brand-primary p-4 flex flex-col border-r border-brand-secondary z-40
                    transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Growify <span className="text-brand-accent">AI</span>
          </h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-brand-text hover:text-white" aria-label="Close menu">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <p className="text-center text-sm text-brand-text -mt-6 mb-4">By Raman</p>
        <nav className="flex flex-col space-y-2">
          <NavItem feature={Feature.CHAT} activeFeature={activeFeature} onClick={handleFeatureSelect}>
            <ChatIcon className="w-6 h-6" />
            <span>Chat</span>
          </NavItem>
          <NavItem feature={Feature.IMAGE_GEN} activeFeature={activeFeature} onClick={handleFeatureSelect}>
            <ImageIcon className="w-6 h-6" />
            <span>Image Generation</span>
          </NavItem>
          <NavItem feature={Feature.IMAGE_EDIT} activeFeature={activeFeature} onClick={handleFeatureSelect}>
            <EditIcon className="w-6 h-6" />
            <span>Image Editing</span>
          </NavItem>
        </nav>
        <div className="mt-auto">
          <NavItem feature={Feature.SETTINGS} activeFeature={activeFeature} onClick={handleFeatureSelect}>
            <SettingsIcon className="w-6 h-6" />
            <span>Settings</span>
          </NavItem>
        </div>
      </aside>
    </>
  );
};
