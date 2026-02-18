import React, { useState } from 'react';
import { ProcessStep } from '../types';
import { Plus, Trash2, Edit2, ArrowDown, Settings, FileText, X, Loader2 } from 'lucide-react';
import { parseProcessDescription } from '../services/geminiService';

interface ProcessBuilderProps {
  steps: ProcessStep[];
  setSteps: (steps: ProcessStep[]) => void;
  processName: string;
  setProcessName: (name: string) => void;
  readOnly?: boolean;
  apiKey: string;
  onNeedApiKey?: () => void;
}

export const ProcessBuilder: React.FC<ProcessBuilderProps> = ({
  steps,
  setSteps,
  processName,
  setProcessName,
  readOnly = false,
  apiKey,
  onNeedApiKey
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<Partial<ProcessStep>>({});
  
  // Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleAddStep = () => {
    if (!newStep.name || !newStep.description) return;
    const step: ProcessStep = {
      id: crypto.randomUUID(),
      name: newStep.name,
      description: newStep.description,
      inputs: newStep.inputs || 'None',
      conditions: newStep.conditions || ''
    };
    setSteps([...steps, step]);
    setNewStep({});
  };

  const handleDelete = (id: string) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const handleUpdateStep = (id: string, field: keyof ProcessStep, value: string) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleImport = async () => {
    if (!importText.trim()) return;
    
    // Show API key modal if missing
    if (!apiKey) {
      onNeedApiKey?.();
      return;
    }
    
    setIsImporting(true);
    try {
      const extractedSteps = await parseProcessDescription(apiKey, importText);
      setSteps(extractedSteps);
      setShowImport(false);
      setImportText('');
    } catch (error) {
      console.error(error);
      alert("Failed to parse process description. Please check your API Key and try again.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden relative">
      
      {/* Import Overlay */}
      {showImport && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl shadow-2xl rounded-lg border border-slate-200 p-6 flex flex-col h-[80%] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Import Process Description
              </h3>
              <button onClick={() => setShowImport(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              Paste a detailed text description of your process below. The AI will automatically extract the steps, inputs, and conditions.
            </p>
            
            <textarea 
              className="flex-1 w-full p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm leading-relaxed resize-none mb-4 font-mono"
              placeholder="Example: The widget manufacturing process begins with Raw Material Intake, where steel sheets are inspected for defects. Next is the Cutting Phase, where sheets are laser-cut into 5x5 squares using 10kWh of energy..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowImport(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                disabled={isImporting || !importText.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-md flex items-center gap-2 shadow-sm transition-all"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" /> Generate Steps
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-start mb-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase">Process Name</label>
          {!readOnly && (
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-3 h-3" /> Paste Process
            </button>
          )}
        </div>
        <input
          type="text"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          disabled={readOnly}
          className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400"
          placeholder="e.g. Widget Manufacturing Line"
        />
      </div>

      {/* Steps List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {steps.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Settings className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No steps defined.</p>
            <p className="text-sm mt-1">Add steps manually or click "Paste Process" to import.</p>
          </div>
        )}

        {steps.map((step, index) => (
          <div key={step.id} className="relative group">
             {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 top-full h-4 w-0.5 bg-slate-300 z-0"></div>
            )}
            
            <div className="relative z-10 flex items-start gap-3 bg-white p-4 rounded-md border border-slate-200 hover:border-blue-300 transition-colors shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                {editingId === step.id && !readOnly ? (
                  <div className="space-y-2">
                    <input
                      className="w-full font-semibold border-b border-slate-200 focus:outline-none focus:border-blue-500 pb-1"
                      value={step.name}
                      onChange={(e) => handleUpdateStep(step.id, 'name', e.target.value)}
                    />
                    <textarea
                      className="w-full text-sm text-slate-600 border rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                      rows={2}
                      value={step.description}
                      onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
                    />
                     <div className="grid grid-cols-2 gap-2">
                         <input 
                            className="text-xs bg-slate-50 p-1 border rounded" 
                            placeholder="Inputs"
                            value={step.inputs}
                            onChange={(e) => handleUpdateStep(step.id, 'inputs', e.target.value)}
                        />
                         <input 
                            className="text-xs bg-slate-50 p-1 border rounded" 
                            placeholder="Conditions (Optional)"
                            value={step.conditions}
                            onChange={(e) => handleUpdateStep(step.id, 'conditions', e.target.value)}
                        />
                     </div>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div onClick={() => !readOnly && setEditingId(step.id)} className={readOnly ? '' : 'cursor-pointer'}>
                    <h3 className="font-semibold text-slate-800">{step.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        In: {step.inputs}
                      </span>
                      {step.conditions && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Cond: {step.conditions}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!readOnly && (
                <button
                  onClick={() => handleDelete(step.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {index < steps.length - 1 && (
              <div className="flex justify-center my-1">
                <ArrowDown className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Step Form */}
      {!readOnly && (
        <div className="p-4 bg-slate-100 border-t border-slate-200">
          <div className="bg-white p-3 rounded-md shadow-sm border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Add New Step</h4>
            <input
              type="text"
              placeholder="Step Name (e.g. Heating)"
              className="w-full mb-2 p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              value={newStep.name || ''}
              onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
            />
            <textarea
              placeholder="Description (What happens here?)"
              className="w-full mb-2 p-2 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              rows={2}
              value={newStep.description || ''}
              onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                    type="text"
                    placeholder="Inputs (Energy, Raw Mats)"
                    className="w-full p-2 text-sm border border-slate-200 rounded outline-none"
                    value={newStep.inputs || ''}
                    onChange={(e) => setNewStep({ ...newStep, inputs: e.target.value })}
                />
                 <input
                    type="text"
                    placeholder="Conditions (Optional)"
                    className="w-full p-2 text-sm border border-slate-200 rounded outline-none"
                    value={newStep.conditions || ''}
                    onChange={(e) => setNewStep({ ...newStep, conditions: e.target.value })}
                />
            </div>
            <button
              onClick={handleAddStep}
              disabled={!newStep.name || !newStep.description}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Step
            </button>
          </div>
        </div>
      )}
    </div>
  );
};