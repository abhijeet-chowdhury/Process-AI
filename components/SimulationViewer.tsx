import React from 'react';
import { SimulationResult } from '../types';
import { Activity, AlertTriangle, CheckCircle, FileText, Info } from 'lucide-react';

interface SimulationViewerProps {
  result: SimulationResult | null;
  isLoading: boolean;
}

export const SimulationViewer: React.FC<SimulationViewerProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 animate-pulse">
        <Activity className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
        <p className="text-lg font-medium">AI is simulating process dynamics...</p>
        <p className="text-sm">Calculating yield, waste, and efficiency.</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400">
        <FileText className="w-16 h-16 mb-4 opacity-20" />
        <p>No simulation data available.</p>
        <p className="text-sm">Build a process and click "Simulate".</p>
      </div>
    );
  }

  // Helper for metric color
  const getMetricColor = (category: string) => {
    switch (category) {
      case 'efficiency': return 'bg-green-100 text-green-700';
      case 'waste': return 'bg-red-100 text-red-700';
      case 'yield': return 'bg-blue-100 text-blue-700';
      case 'throughput': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Simulation Results
        </h2>
        <span className={`px-2 py-1 rounded text-xs font-bold ${result.type === 'OPTIMIZED' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'}`}>
          {result.type}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Metrics Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.metrics.map((metric, idx) => (
              <div key={idx} className={`p-4 rounded-lg border border-transparent ${getMetricColor(metric.category)} bg-opacity-50`}>
                <p className="text-xs font-semibold uppercase opacity-70 mb-1">{metric.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-sm font-medium opacity-80">{metric.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> AI Analysis
          </h3>
          <p className="text-sm text-blue-900 leading-relaxed">{result.summary}</p>
        </div>

        {/* Assumptions */}
        {result.assumptions && result.assumptions.length > 0 && (
           <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
           <h3 className="text-sm font-bold text-amber-800 mb-2">Assumptions Made</h3>
           <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
             {result.assumptions.map((a, i) => (
               <li key={i}>{a}</li>
             ))}
           </ul>
         </div>
        )}

        {/* Execution Trace */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">Execution Trace</h3>
          <div className="space-y-3">
            {result.logs.map((log, idx) => (
              <div key={idx} className="flex gap-3 text-sm p-3 bg-slate-50 rounded-md border border-slate-100">
                <div className="mt-0.5">
                  {log.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {log.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {log.status === 'failure' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-700">{log.stepName}</span>
                    <span className="text-xs text-slate-400 px-1.5 py-0.5 border rounded">{log.outcome}</span>
                  </div>
                  <p className="text-slate-600">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
