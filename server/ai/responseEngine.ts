/**
 * NEXUS AI - Query Response & Natural Language Engine
 * 
 * Secure Bridge to Real AI Inference via Google Gemini API.
 * Never creates fake responses or hard-codes answers.
 * Implements context fusion with untrusted data isolation.
 */

import { GeminiService } from '../services/geminiService.js';
import { ContextPackage, ImagePayload } from './providers/aiProvider.js';
import { IntentClassificationResult } from './intentClassifier.js';
import { CollectedContext } from './contextCollector.js';
import { RuntimeManager, RuntimeStatus } from './runtimeManager.js';
import { DocumentCitation } from '../../src/types/index.js';

export interface UserResponsePayload {
  answer: string;
  sources: string[];
  suggestedActions: string[];
  citations?: DocumentCitation[];
}

export interface ProcessingMetadataPayload {
  intent: string;
  contextSources: string[];
  model: string;
  runtime: string;
  latencyMs: number;
  tokensPerSecond?: number;
  securityStatus: 'passed' | 'blocked' | 'requires_elevation';
  hardware: {
    platform: string;
    cpu: string;
    npuAvailable: boolean;
    qualcommRuntime: string;
    executionTarget: string;
  };
}

export interface EngineResult {
  success: boolean;
  answer: string;
  error?: string;
  fallbackAvailable?: boolean;
  userResponse: UserResponsePayload;
  processingMetadata: ProcessingMetadataPayload;
  citations: DocumentCitation[];
  sources: string[];
  contextUsed: string[];
  provider: string;
  model: string;
  latencyMs: number;
  tokensPerSecond?: number;
}

export class ResponseEngine {
  public static async generateResponse(
    query: string,
    classification: IntentClassificationResult,
    context: CollectedContext,
    runtimeStatus: RuntimeStatus,
    image?: ImagePayload
  ): Promise<EngineResult> {
    const startTime = performance.now();

    // 1. Build Context Package from AVAILABLE REAL DATA only
    const contextPackage: ContextPackage = {};

    // Screen (only if real text exists)
    if (context.screenContext && context.screenContext.text && context.screenContext.text.trim().length > 0) {
      contextPackage.screen = {
        application: context.screenContext.application,
        windowTitle: context.screenContext.windowTitle,
        text: context.screenContext.text,
      };
    }

    // Documents (only if real retrieved citations exist)
    if (context.documentCitations && context.documentCitations.length > 0) {
      contextPackage.documents = context.documentCitations.map((c) => ({
        title: c.documentTitle,
        snippet: c.snippet,
        chunkIndex: c.chunkIndex,
        similarity: c.similarity,
      }));
    }

    // Memory (only if real memory records exist)
    if (context.memoryItems && context.memoryItems.length > 0) {
      contextPackage.memory = context.memoryItems.map((m) => ({
        title: m.title,
        content: m.content,
      }));
    }

    // Meeting (only if real meeting summary/transcript exists)
    if (context.meetingSummary && (context.meetingSummary.title || context.meetingSummary.keyDecisions?.length)) {
      contextPackage.meeting = {
        title: context.meetingSummary.title,
        decisions: context.meetingSummary.keyDecisions,
      };
    }

    // Conversation History (Requirement #15 & #16 & #21)
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      contextPackage.conversationHistory = context.conversationHistory;
    }

    // 2. Call Real Gemini Service
    try {
      const geminiResult = await GeminiService.executeChat(
        query,
        contextPackage,
        image
      );

      const latencyMs = geminiResult.latencyMs || Math.round(performance.now() - startTime);
      const suggestedActions = this.generateSuggestedActions(classification.intent, geminiResult.contextUsed);

      return {
        success: true,
        answer: geminiResult.answer,
        userResponse: {
          answer: geminiResult.answer,
          sources: geminiResult.sources,
          suggestedActions,
          citations: context.documentCitations,
        },
        processingMetadata: {
          intent: classification.intent,
          contextSources: geminiResult.sources,
          model: geminiResult.model,
          runtime: 'Google Gemini (Cloud API Gateway)',
          latencyMs,
          tokensPerSecond: geminiResult.tokensPerSecond,
          securityStatus: 'passed',
          hardware: {
            platform: runtimeStatus.platform,
            cpu: runtimeStatus.cpu,
            npuAvailable: runtimeStatus.npuAvailable,
            qualcommRuntime: runtimeStatus.qualcommRuntime,
            executionTarget: 'Cloud API (Gemini)',
          },
        },
        citations: context.documentCitations,
        sources: geminiResult.sources,
        contextUsed: geminiResult.contextUsed,
        provider: geminiResult.provider,
        model: geminiResult.model,
        latencyMs,
        tokensPerSecond: geminiResult.tokensPerSecond,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorMessage = err?.message || 'Gemini inference failed.';

      return {
        success: false,
        answer: '',
        error: errorMessage,
        fallbackAvailable: true,
        userResponse: {
          answer: `⚠️ ${errorMessage}`,
          sources: [],
          suggestedActions: ['Retry query', 'Verify Gemini API Key', 'Inspect System Status'],
          citations: [],
        },
        processingMetadata: {
          intent: classification.intent,
          contextSources: [],
          model: GeminiService.getModelName(),
          runtime: 'Google Gemini (Cloud)',
          latencyMs,
          tokensPerSecond: 0,
          securityStatus: 'passed',
          hardware: {
            platform: runtimeStatus.platform,
            cpu: runtimeStatus.cpu,
            npuAvailable: runtimeStatus.npuAvailable,
            qualcommRuntime: runtimeStatus.qualcommRuntime,
            executionTarget: 'Cloud API (Gemini)',
          },
        },
        citations: [],
        sources: [],
        contextUsed: [],
        provider: 'gemini',
        model: GeminiService.getModelName(),
        latencyMs,
        tokensPerSecond: 0,
      };
    }
  }

  private static generateSuggestedActions(intent: string, contextUsed: string[]): string[] {
    const actions: string[] = [];
    if (contextUsed.includes('Screen')) {
      actions.push('Copy code fix from screen');
      actions.push('Explain screen error in detail');
    }
    if (contextUsed.includes('Document')) {
      actions.push('Extract summary table');
      actions.push('Find related document chunks');
    }
    if (contextUsed.includes('Memory')) {
      actions.push('Update local memory notes');
    }

    if (actions.length === 0) {
      if (intent === 'CODE_ANALYSIS') {
        actions.push('Provide complete working example');
        actions.push('Explain time complexity');
      } else {
        actions.push('Ask a follow-up question');
        actions.push('Summarize key points');
      }
    }
    return actions.slice(0, 3);
  }
}
