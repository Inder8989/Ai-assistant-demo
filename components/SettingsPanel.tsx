import React from 'react';

export const SettingsPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-brand-secondary p-4 md:p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-brand-text">Manage application configuration.</p>
      </header>
      
      <div className="max-w-md space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
          <p className="text-sm text-brand-text mb-4">
            The required Google Gemini API key for this application is configured securely via an environment variable (`API_KEY`) in the deployment environment.
          </p>
           <p className="text-sm text-brand-text">
            There are no user-configurable keys required here.
          </p>
        </div>
      </div>
    </div>
  );
};