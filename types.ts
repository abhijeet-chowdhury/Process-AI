export interface ProcessStep {
  id: string;
  name: string;
  description: string;
  inputs: string;
  conditions?: string;
}

export interface SimulationMetric {
  name: string;
  value: number;
  unit: string;
  category: 'efficiency' | 'waste' | 'yield' | 'throughput' | 'other';
}

export interface SimulationLog {
  stepId: string;
  stepName: string;
  outcome: string;
  details: string;
  status: 'success' | 'warning' | 'failure';
}

export interface SimulationResult {
  id: string;
  timestamp: number;
  type: 'BASELINE' | 'OPTIMIZED';
  metrics: SimulationMetric[];
  logs: SimulationLog[];
  summary: string;
  assumptions: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isOptimizedProposal?: boolean;
  proposedProcess?: ProcessStep[];
}

export interface AppState {
  processName: string;
  steps: ProcessStep[];
  baselineResult: SimulationResult | null;
  optimizedResult: SimulationResult | null;
}
