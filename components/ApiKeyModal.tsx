import React, { useState } from 'react';
import { Key, ShieldCheck, ChevronRight } from 'lucide-react';

interface ApiKeyModalProps {
  setApiKey: (key: string) => void;
  isOpen: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ setApiKey, isOpen }) => {
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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Enter API Key</h2>
          <p className="text-slate-500 mt-2 text-sm">
            To use ProcessAI, please provide your Google Gemini API key. 
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

        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Your key remains private and local.</span>
        </div>
      </div>
    </div>
  );
};
