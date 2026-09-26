/**
 * NEXUS AI - Central AI Service Configuration
 * 
 * Supports configurable AI provider and model via environment variables.
 * Default provider: 'gemini'
 * Primary model: 'gemini-3.1-flash-lite' (high speed, ample quota, recommended flash-lite tier)
 * Fallback models: 'gemini-flash-latest', 'gemini-3.8-flash'
 */

export interface AIConfig {
  provider: 'gemini' | 'local';
  model: string;
  fallbackModels: string[];
  apiKey: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export function getAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase() === 'local' ? 'local' : 'gemini';
  const model = process.env.AI_MODEL || 'gemini-3.1-flash-lite';
  const fallbackModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'].filter(m => m !== model);
  const apiKey = process.env.GEMINI_API_KEY || '';

  return {
    provider,
    model,
    fallbackModels,
    apiKey,
    maxTokens: 2048,
    temperature: 0.7,
    timeoutMs: 25000,
  };
}
