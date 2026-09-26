/**
 * NEXUS AI - Server-Side Gemini Cloud Integration
 * Used only when user explicitly enables Hybrid or Cloud Mode.
 * All API keys remain strictly server-side.
 */

import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return geminiClient;
}

export async function callCloudGemini(prompt: string, systemInstruction?: string): Promise<{
  text: string;
  latencyMs: number;
  model: string;
}> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('Cloud Gemini API key is not configured in environment.');
  }

  const start = performance.now();
  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: systemInstruction ? { systemInstruction } : undefined,
  });

  const latencyMs = Math.round(performance.now() - start);
  return {
    text: response.text || 'No response generated.',
    latencyMs,
    model: 'gemini-3.8-flash (Cloud)',
  };
}
