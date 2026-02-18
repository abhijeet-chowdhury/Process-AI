import React, { useState, useEffect } from 'react';
import { ProcessBuilder } from './components/ProcessBuilder';
import { SimulationViewer } from './components/SimulationViewer';
import { ComparisonView } from './components/ComparisonView';
import { ChatPanel } from './components/ChatPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ProcessStep, SimulationResult, ChatMessage } from './types';
import { simulateProcess } from './services/geminiService';
import { Play, RotateCcw, Key } from 'lucide-react';

const STORAGE_KEY = 'process_ai_state_v2';
const API_KEY_STORAGE = 'process_ai_api_key';

const App: React.FC = () => {
  // --- State ---
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'build' | 'results' | 'compare'>('build');
  const [processName, setProcessName] = useState('My Process');
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [baselineResult, setBaselineResult] = useState<SimulationResult | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<SimulationResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // --- Persistence ---
  
  // Load API Key
  useEffect(() => {
    const key = localStorage.getItem(API_KEY_STORAGE);
    if (key) setApiKey(key);
  }, []);

  // Save API Key
  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
    setShowApiKeyModal(false); // Close modal after setting key
  };

  // Load App State
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProcessName(parsed.processName || 'My Process');
        setSteps(parsed.steps || []);
        setBaselineResult(parsed.baselineResult);
        setOptimizedResult(parsed.optimizedResult);
        setChatHistory(parsed.chatHistory || []);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  // Save App State
  useEffect(() => {
    const state = {
      processName,
      steps,
      baselineResult,
      optimizedResult,
      chatHistory
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [processName, steps, baselineResult, optimizedResult, chatHistory]);

  // --- Handlers ---
  const handleRunSimulation = async () => {
    if (steps.length === 0) return;
    
    // Show modal if API key is missing
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    setIsSimulating(true);
    setActiveTab('results'); 

    try {
      // Standard run determines the baseline
      const result = await simulateProcess(apiKey, processName, steps, 'BASELINE');
      setBaselineResult(result);
    } catch (error) {
      console.error("Simulation failed", error);
      alert("Simulation failed. Check API Key configuration.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyOptimization = async (newSteps: ProcessStep[]) => {
    // Show modal if API key is missing
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }
    
    // 1. Update Steps
    setSteps(newSteps);
    // 2. Run Simulation as OPTIMIZED
    setIsSimulating(true);
    setActiveTab('results');
    
    try {
      // Extract metric names from baseline to enforce consistency in comparison
      const referenceMetrics = baselineResult 
        ? baselineResult.metrics.map(m => m.name) 
        : undefined;

      const result = await simulateProcess(apiKey, processName, newSteps, 'OPTIMIZED', referenceMetrics);
      setOptimizedResult(result);
      
      // Auto-switch to compare if baseline exists
      if (baselineResult) {
        setActiveTab('compare');
      }
    } catch (error) {
      console.error(error);
      alert("Optimization simulation failed.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    if(confirm("Clear all data and start over?")) {
      setProcessName('New Process');
      setSteps([]);
      setBaselineResult(null);
      setOptimizedResult(null);
      setChatHistory([]);
      localStorage.removeItem(STORAGE_KEY);
      setActiveTab('build');
    }
  };

  const clearApiKey = () => {
    if(confirm("Remove saved API Key?")) {
      setApiKey('');
      localStorage.removeItem(API_KEY_STORAGE);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <ApiKeyModal isOpen={showApiKeyModal} setApiKey={handleSetApiKey} onClose={() => setShowApiKeyModal(false)} />

      {/* Navbar */}
      <header className="bg-slate-900 text-white p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center font-bold text-lg">P</div>
          <h1 className="font-bold text-lg tracking-tight">ProcessAI <span className="text-slate-400 font-normal text-sm ml-2">Simulator & Optimizer</span></h1>
        </div>
        <div className="flex items-center gap-4">
           {/* Tab Switcher */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('build')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'build' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Process
            </button>
            <button 
               onClick={() => setActiveTab('results')}
               disabled={!baselineResult && !optimizedResult && !isSimulating}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${activeTab === 'results' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Results
            </button>
            <button 
               onClick={() => setActiveTab('compare')}
               disabled={!baselineResult || !optimizedResult}
               className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 ${activeTab === 'compare' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Compare
            </button>
          </div>
          
          <div className="flex items-center border-l border-slate-700 pl-4 gap-2">
            <button onClick={clearApiKey} className="text-slate-400 hover:text-blue-400 transition-colors" title="Change API Key">
                <Key className="w-5 h-5" />
            </button>
            <button onClick={handleReset} className="text-slate-400 hover:text-red-400 transition-colors" title="Reset Project">
                <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Workspace */}
        <div className="flex-1 flex flex-col min-w-0 p-4 gap-4 overflow-hidden">
          
          {/* Main Workspace Toolbar */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === 'build' && "Process Definition"}
              {activeTab === 'results' && "Simulation Analysis"}
              {activeTab === 'compare' && "Baseline vs. Optimized"}
            </h2>
            
            {activeTab === 'build' && (
              <button
                onClick={handleRunSimulation}
                disabled={steps.length === 0 || isSimulating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-5 py-2 rounded-md font-bold shadow-sm transition-all"
              >
                {isSimulating ? 'Simulating...' : <><Play className="w-4 h-4 fill-current" /> Simulate Process</>}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'build' && (
              <ProcessBuilder 
                steps={steps} 
                setSteps={setSteps} 
                processName={processName}
                setProcessName={setProcessName}
                apiKey={apiKey}
                onNeedApiKey={() => setShowApiKeyModal(true)}
              />
            )}

            {activeTab === 'results' && (
               <SimulationViewer 
                  result={optimizedResult || baselineResult} 
                  isLoading={isSimulating}
               />
            )}

            {activeTab === 'compare' && baselineResult && optimizedResult && (
              <ComparisonView 
                baseline={baselineResult}
                optimized={optimizedResult}
              />
            )}
          </div>
        </div>

        {/* Right Panel: Chatbot */}
        <div className="w-[400px] flex-shrink-0 shadow-xl z-20">
          <ChatPanel 
            chatHistory={chatHistory} 
            setChatHistory={setChatHistory}
            currentProcess={{ name: processName, steps }}
            simulationResult={optimizedResult || baselineResult}
            onApplyOptimization={handleApplyOptimization}
            apiKey={apiKey}
            onNeedApiKey={() => setShowApiKeyModal(true)}
          />
        </div>

      </main>
    </div>
  );
};

export default App;
