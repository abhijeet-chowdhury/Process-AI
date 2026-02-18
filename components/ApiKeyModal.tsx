import React, { useState } from 'react';
import { Key, ShieldCheck, ChevronRight, X } from 'lucide-react';

interface ApiKeyModalProps {
  setApiKey: (key: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ setApiKey, isOpen, onClose }) => {
  const [inputKey, setInputKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-8 animate-in fade-in zoom-in duration-300 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          title="Close without API Key"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Enter API Key</h2>
          <p className="text-slate-500 mt-2 text-sm">
            To use ProcessAI features, please provide your Google Gemini API key. 
            It is stored locally in your browser and never sent to our servers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono text-sm"
              autoFocus
            />
          </div>
          
          <button
            type="submit"
            disabled={!inputKey.trim()}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors shadow-sm"
          >
            Get Started <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-slate-600 mb-2">
            <span className="font-semibold text-slate-800">Don't have an API key?</span> Get one free from Google AI Studio:
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 underline inline-flex items-center gap-1"
          >
            aistudio.google.com/app/apikey ↗
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Your key remains private and local.</span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors"
        >
          Continue exploring without API Key
        </button>
      </div>
    </div>
  );
};
