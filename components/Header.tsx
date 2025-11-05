import React from 'react';
import { Feature } from '../types';
import { MenuIcon } from './icons';

interface HeaderProps {
  activeFeature: Feature;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeFeature, onMenuClick }) => {
  return (
    <header className="flex items-center p-4 bg-brand-secondary/50 md:hidden border-b border-brand-secondary flex-shrink-0">
      <button onClick={onMenuClick} className="text-brand-text hover:text-white mr-4" aria-label="Open menu">
        <MenuIcon className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-semibold text-white">{activeFeature}</h2>
    </header>
  );
};
