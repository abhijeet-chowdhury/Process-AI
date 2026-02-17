import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ProcessStep } from '../types';
import { Send, Bot, User, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { chatWithProcessAI } from '../services/geminiService';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  setChatHistory: (history: ChatMessage[]) => void;
  currentProcess: { name: string; steps: ProcessStep[] };
  simulationResult: any;
  onApplyOptimization: (newSteps: ProcessStep[]) => void;
  apiKey: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  chatHistory,
  setChatHistory,
  currentProcess,
  simulationResult,
  onApplyOptimization,
  apiKey
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatWithProcessAI(
        apiKey,
        newHistory,
        input,
        currentProcess,
        simulationResult
      );

      const aiMsg: ChatMessage = {
        role: 'model',
        text: response.text,
        isOptimizedProposal: !!response.proposedProcess,
        proposedProcess: response.proposedProcess
      };
      setChatHistory([...newHistory, aiMsg]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'model', text: 'Sorry, I encountered an error connecting to the AI. Please check your API Key.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          Process Assistant
        </h2>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center mt-10 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Ask me to analyze bottlenecks or suggest optimizations.</p>
            <p className="text-xs mt-2">Example: "How can I reduce waste in step 2?"</p>
          </div>
        )}
        
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Optimization Proposal Card */}
              {msg.isOptimizedProposal && msg.proposedProcess && (
                <div className="mt-3 bg-white p-3 rounded border border-purple-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-purple-800 text-xs uppercase">Optimization Ready</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    A new process flow with {msg.proposedProcess.length} steps has been generated.
                  </p>
                  <button 
                    onClick={() => onApplyOptimization(msg.proposedProcess!)}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-xs font-bold transition-colors"
                  >
                    Apply Changes & Simulate <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-lg p-2 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 text-sm resize-none py-3"
            rows={1}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
