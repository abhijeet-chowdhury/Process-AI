import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ProcessStep, SimulationResult, ChatMessage, SimulationMetric } from "../types";

// Helper to get AI instance with dynamic key
const getAi = (apiKey: string) => new GoogleGenAI({ apiKey });

// --- Simulation Service ---

export const simulateProcess = async (
  apiKey: string,
  processName: string,
  steps: ProcessStep[],
  type: 'BASELINE' | 'OPTIMIZED',
  referenceMetrics?: string[] // New parameter to enforce consistency
): Promise<SimulationResult> => {
  
  if (!apiKey) throw new Error("API Key is missing");

  const ai = getAi(apiKey);
  
  // improved prompt to force consistent metric names if a baseline exists
  const metricInstruction = referenceMetrics && referenceMetrics.length > 0
    ? `IMPORTANT: You must calculate values for the following metrics to enable comparison: ${JSON.stringify(referenceMetrics)}. You may add other relevant metrics, but these specific names must be present in the output.`
    : `Estimate realistic outcomes for key performance indicators like Yield, Waste, Throughput, Energy Efficiency, and Cost.`;

  const prompt = `
    Analyze the following process: "${processName}".
    Steps: ${JSON.stringify(steps)}
    
    Task: Simulate this process logically. 
    1. ${metricInstruction}
    2. Create a step-by-step execution trace.
    3. List any assumptions made during simulation.
    4. Provide a textual summary.
    
    Be deterministic and grounded in the provided steps. Do not hallucinate external factors unless they are standard industry norms.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['efficiency', 'waste', 'yield', 'throughput', 'other'] }
              }
            }
          },
          logs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepId: { type: Type.STRING },
                stepName: { type: Type.STRING },
                outcome: { type: Type.STRING },
                details: { type: Type.STRING },
                status: { type: Type.STRING, enum: ['success', 'warning', 'failure'] }
              }
            }
          },
          summary: { type: Type.STRING },
          assumptions: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const data = JSON.parse(text);

  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type,
    metrics: data.metrics,
    logs: data.logs,
    summary: data.summary,
    assumptions: data.assumptions
  };
};

// --- Import Parsing Service ---

export const parseProcessDescription = async (apiKey: string, text: string): Promise<ProcessStep[]> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = getAi(apiKey);

  const prompt = `
    Task: Extract a structured sequential process definition from the provided text.
    Text: "${text}"
    
    Output: A JSON array of process steps. Each step must have:
    - id: A unique string ID.
    - name: Short concise title.
    - description: Detailed explanation of the action.
    - inputs: List of resources/materials used (string).
    - conditions: Any specific conditions (temp, time, pressure) mentioned (string).
    
    Ensure the sequence matches the text description.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            inputs: { type: Type.STRING },
            conditions: { type: Type.STRING }
          },
          required: ['id', 'name', 'description']
        }
      }
    }
  });

  const textRes = response.text;
  if (!textRes) throw new Error("No response from AI");
  
  const steps = JSON.parse(textRes);
  
  return steps.map((s: any) => ({
    id: s.id || crypto.randomUUID(),
    name: s.name,
    description: s.description,
    inputs: s.inputs || 'None',
    conditions: s.conditions || ''
  }));
};

// --- Chat & Optimization Service ---

const updateProcessTool: FunctionDeclaration = {
  name: 'updateProcessDefinition',
  description: 'Propose a new, optimized version of the process steps.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            inputs: { type: Type.STRING },
            conditions: { type: Type.STRING }
          },
          required: ['id', 'name', 'description', 'inputs']
        }
      },
      reasoning: { type: Type.STRING, description: "Why these changes were made." }
    },
    required: ['steps', 'reasoning']
  }
};

export const chatWithProcessAI = async (
  apiKey: string,
  history: ChatMessage[],
  currentMessage: string,
  currentProcess: { name: string; steps: ProcessStep[] },
  simulationContext: SimulationResult | null
): Promise<{ text: string; proposedProcess?: ProcessStep[] }> => {
  if (!apiKey) throw new Error("API Key is missing");
  const ai = getAi(apiKey);

  const systemContext = `
    You are an expert Process Engineer AI.
    Current Process: ${currentProcess.name}
    Steps: ${JSON.stringify(currentProcess.steps)}
    Latest Simulation Results: ${JSON.stringify(simulationContext?.metrics || 'No simulation run yet')}
    
    Goal: Assist the user in analyzing and optimizing the process.
    If the user asks to optimize, analyze bottlenecks and suggest a better flow.
    If you have a concrete optimization proposal, call the function 'updateProcessDefinition'.
  `;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemContext,
      tools: [{ functionDeclarations: [updateProcessTool] }],
    }
  });

  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'AI'}: ${h.text}`).join('\n');
  const fullPrompt = `${historyText}\nUser: ${currentMessage}`;

  const result = await chat.sendMessage({ message: fullPrompt });
  
  const calls = result.functionCalls;
  
  if (calls && calls.length > 0) {
    const call = calls[0];
    if (call.name === 'updateProcessDefinition') {
      const args = call.args as any;
      return {
        text: `I have generated an optimized version of the process based on your request. Reasoning: ${args.reasoning}. Click 'Apply Changes' to review and simulate.`,
        proposedProcess: args.steps
      };
    }
  }

  return { text: result.text || "I processed that but have no specific output." };
};
