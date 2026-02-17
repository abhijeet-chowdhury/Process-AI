import React from 'react';
import { SimulationResult, SimulationMetric } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonViewProps {
  baseline: SimulationResult;
  optimized: SimulationResult;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ baseline, optimized }) => {
  
  // Combine metrics for charting
  const chartData = baseline.metrics.map(bMetric => {
    const oMetric = optimized.metrics.find(m => m.name === bMetric.name);
    return {
      name: bMetric.name,
      Baseline: bMetric.value,
      Optimized: oMetric ? oMetric.value : 0,
      unit: bMetric.unit
    };
  });

  const getDelta = (metricName: string) => {
    const b = baseline.metrics.find(m => m.name === metricName)?.value || 0;
    const o = optimized.metrics.find(m => m.name === metricName)?.value || 0;
    if (b === 0) return 0;
    return ((o - b) / b) * 100;
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
         <h2 className="font-bold text-slate-800">Performance Comparison</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Visual Chart */}
        <div className="h-64 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Optimized" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Baseline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">Optimized</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Delta</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {baseline.metrics.map((metric) => {
                const optMetric = optimized.metrics.find(m => m.name === metric.name);
                const delta = getDelta(metric.name);
                const isPositiveGood = ['yield', 'efficiency', 'throughput'].includes(metric.category);
                const isImprovement = isPositiveGood ? delta > 0 : delta < 0;
                
                return (
                  <tr key={metric.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{metric.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {metric.value} <span className="text-xs">{metric.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-semibold">
                       {optMetric?.value} <span className="text-xs">{optMetric?.unit}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isImprovement ? 'bg-green-100 text-green-800' : delta === 0 ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
