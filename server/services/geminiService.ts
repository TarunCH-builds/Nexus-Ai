/**
 * NEXUS AI - Gemini Service
 * 
 * Secure backend service interface for Gemini cloud intelligence.
 * Handles model invocation, error containment, timeout guards, and context fusion.
 * All credentials remain strictly server-side.
 */

import { geminiProvider } from '../ai/providers/geminiProvider.js';
import {
  ContextPackage,
  GenerateOptions,
  GenerateResult,
  ImagePayload,
  ProviderHealthStatus,
} from '../ai/providers/aiProvider.js';
import { getAIConfig } from '../ai/config.js';

export class GeminiService {
  public static isAvailable(): boolean {
    return geminiProvider.isConfigured();
  }

  public static async getHealth(): Promise<ProviderHealthStatus> {
    return geminiProvider.healthCheck();
  }

  public static async testConnection() {
    if (geminiProvider.testConnection) {
      return geminiProvider.testConnection();
    }
    return {
      success: false,
      latency_ms: 0,
      model: this.getModelName(),
      provider: 'gemini',
      error: 'Test connection not supported',
      code: 'PROVIDER_ERROR',
    };
  }

  public static async executeChat(
    message: string,
    context?: ContextPackage,
    image?: ImagePayload,
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    if (!message || message.trim().length === 0) {
      return {
        success: false,
        answer: '',
        sources: [],
        contextUsed: [],
        provider: 'gemini',
        model: this.getModelName(),
        latencyMs: 0,
        processing: 'cloud',
        error: 'Query message cannot be empty.',
        fallback_available: true,
      };
    }

    try {
      let res: GenerateResult;
      if (image && image.data) {
        res = await geminiProvider.generateWithImage(message, image, context, options);
      } else {
        res = await geminiProvider.generateWithContext(message, context || {}, options);
      }
      return {
        ...res,
        success: true,
      };
    } catch (err: any) {
      return {
        success: false,
        answer: '',
        sources: [],
        contextUsed: [],
        provider: 'gemini',
        model: this.getModelName(),
        latencyMs: 0,
        processing: 'cloud',
        error: err.message || 'Gemini inference failed.',
        fallback_available: true,
      };
    }
  }

  public static async execute(
    message: string,
    context?: ContextPackage,
    image?: ImagePayload,
    options?: GenerateOptions
  ): Promise<GenerateResult> {
    return this.executeChat(message, context, image, options);
  }

  public static async executeStream(
    message: string,
    context?: ContextPackage,
    options?: GenerateOptions,
    onChunk?: (chunk: string) => void
  ): Promise<GenerateResult> {
    if (!geminiProvider.generateStream) {
      throw new Error('Streaming is not supported by current provider.');
    }
    return geminiProvider.generateStream(message, context || {}, options, onChunk);
  }

  public static getModelName(): string {
    return getAIConfig().model;
  }
}
