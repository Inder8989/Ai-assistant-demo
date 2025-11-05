
import React from 'react';
import { Message, Role } from '../types';
import Markdown from 'react-markdown';

interface MessageDisplayProps {
  message: Message;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xl p-4 rounded-lg ${isUser ? 'bg-brand-accent text-white' : 'bg-brand-primary'}`}>
        {message.image && (
          <img src={message.image} alt="User upload" className="rounded-md mb-2 max-h-64" />
        )}
        <div className="prose prose-invert prose-p:my-1 prose-headings:my-2 text-brand-light">
           <Markdown>{message.text}</Markdown>
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-gray-600 pt-2">
            <h4 className="text-xs font-bold mb-1 text-gray-400">Sources:</h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {message.sources.map((source, i) => (
                <li key={i}>
                  <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">
                    {source.title || source.uri}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
