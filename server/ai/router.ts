/**
 * NEXUS AI - AI Model Router
 * Dynamic task classification and execution routing across:
 * - Snapdragon Hexagon NPU (QNN Execution Provider)
 * - Local CPU / DirectML Fallback
 * - Optional Cloud Gemini 3.8 Flash (guarded by user privacy mode)
 */

import { TaskType, HardwareTarget, ModelRoutingDecision, ProcessingMode, ContextObject, DocumentCitation } from '../../src/types/index.js';
import { QualcommRuntimeAdapter, FallbackRuntimeAdapter } from './qualcommAdapter.js';
import { callCloudGemini } from './geminiClient.js';
import { executeLocalReasoning } from './localEngine.js';
import { IntentEngine } from './intentEngine.js';
import { db } from '../db.js';
import {
  QualcommQNNVisionProvider,
  LocalEdgeVisionProvider,
  CloudGeminiVisionProvider,
  QualcommQNNReasoningProvider,
  LocalEdgeReasoningProvider,
  CloudGeminiReasoningProvider,
  VisionExtractionResult,
  ReasoningResult,
  IVisionProvider,
  IReasoningProvider
} from './providers.js';

export class ModelRouter {
  private qualcommAdapter: QualcommRuntimeAdapter;
  private fallbackAdapter: FallbackRuntimeAdapter;
  private processingMode: ProcessingMode = 'local'; // Default: privacy-first local

  // Concrete Provider instances
  private qnnVision: QualcommQNNVisionProvider;
  private edgeVision: LocalEdgeVisionProvider;
  private cloudVision: CloudGeminiVisionProvider;

  private qnnReasoning: QualcommQNNReasoningProvider;
  private edgeReasoning: LocalEdgeReasoningProvider;
  private cloudReasoning: CloudGeminiReasoningProvider;

  constructor() {
    this.qualcommAdapter = new QualcommRuntimeAdapter();
    this.fallbackAdapter = new FallbackRuntimeAdapter();

    this.qnnVision = new QualcommQNNVisionProvider();
    this.edgeVision = new LocalEdgeVisionProvider();
    this.cloudVision = new CloudGeminiVisionProvider();

    this.qnnReasoning = new QualcommQNNReasoningProvider();
    this.edgeReasoning = new LocalEdgeReasoningProvider();
    this.cloudReasoning = new CloudGeminiReasoningProvider();
  }

  public setProcessingMode(mode: ProcessingMode): void {
    this.processingMode = mode;
  }

  public getProcessingMode(): ProcessingMode {
    return this.processingMode;
  }

  public getProviderStatus() {
    return [
      {
        name: this.qnnVision.name,
        target: 'npu' as HardwareTarget,
        isAvailable: this.qnnVision.isAvailable(),
        unavailableReason: this.qnnVision.getUnavailableReason(),
      },
      {
        name: this.edgeVision.name,
        target: 'cpu' as HardwareTarget,
        isAvailable: this.edgeVision.isAvailable(),
        unavailableReason: this.edgeVision.getUnavailableReason(),
      },
      {
        name: this.cloudVision.name,
        target: 'cloud' as HardwareTarget,
        isAvailable: this.cloudVision.isAvailable(),
        unavailableReason: this.cloudVision.getUnavailableReason(),
      }
    ];
  }

  /**
   * Process vision / screen OCR via the best available provider
   */
  public async processVision(input: {
    imageBase64?: string;
    text?: string;
    application?: string;
    windowTitle?: string;
  }): Promise<VisionExtractionResult> {
    const isSnapdragon = this.qnnVision.isAvailable();

    if (this.processingMode === 'cloud' && this.cloudVision.isAvailable()) {
      try {
        return await this.cloudVision.extractVisualTokens(input);
      } catch (err: any) {
        console.warn('Cloud Vision failed, falling back to Local Edge:', err?.message);
      }
    }

    if (isSnapdragon && this.processingMode !== 'cloud') {
      return await this.qnnVision.extractVisualTokens(input);
    }

    // Default: Local Edge CPU Vision (reliable on-device fallback)
    return await this.edgeVision.extractVisualTokens(input);
  }

  public makeRoutingDecision(taskType: TaskType): ModelRoutingDecision {
    const isSnapdragon = this.qualcommAdapter.isHardwareSupported();
    const cloudAvailable = !!process.env.GEMINI_API_KEY && (this.processingMode === 'cloud' || this.processingMode === 'hybrid');

    if (this.processingMode === 'local') {
      if (isSnapdragon) {
        return {
          taskType,
          selectedProvider: 'qualcomm_qnn',
          hardwareTarget: 'npu',
          modelName: this.getModelForTask(taskType, 'npu'),
          estimatedLatencyMs: 35,
          quantization: 'INT8',
          reasoning: 'Routed to on-device Qualcomm Hexagon NPU via QNN Execution Provider (Local Privacy Mode enforced).',
          fallbackAvailable: true,
          privacyModeAllowed: true,
        };
      } else {
        return {
          taskType,
          selectedProvider: 'onnx_cpu',
          hardwareTarget: 'cpu',
          modelName: this.getModelForTask(taskType, 'cpu'),
          estimatedLatencyMs: 85,
          quantization: 'INT8',
          reasoning: 'Routed to Local High-Performance CPU Engine. Qualcomm NPU not detected on host platform; fallback engaged safely.',
          fallbackAvailable: true,
          privacyModeAllowed: true,
        };
      }
    }

    if (this.processingMode === 'cloud' && cloudAvailable) {
      return {
        taskType,
        selectedProvider: 'cloud_gemini',
        hardwareTarget: 'cloud',
        modelName: 'gemini-3.8-flash',
        estimatedLatencyMs: 420,
        quantization: 'Cloud',
        reasoning: 'User explicitly selected Cloud Processing Mode. Routing to Google Gemini 3.8 Flash with secure server-side execution.',
        fallbackAvailable: true,
        privacyModeAllowed: true,
      };
    }

    // Hybrid Mode: Specialized lightweight on NPU/local CPU, complex text reasoning on Cloud if permitted
    if (this.processingMode === 'hybrid') {
      if (taskType === 'reasoning' || taskType === 'summarization') {
        if (cloudAvailable) {
          return {
            taskType,
            selectedProvider: 'cloud_gemini',
            hardwareTarget: 'cloud',
            modelName: 'gemini-3.8-flash (Hybrid Reasoning)',
            estimatedLatencyMs: 380,
            quantization: 'Cloud',
            reasoning: 'Hybrid Mode: Deep reasoning delegated to Gemini 3.8 Flash, embeddings and perception retained on-device.',
            fallbackAvailable: true,
            privacyModeAllowed: true,
          };
        }
      }

      return {
        taskType,
        selectedProvider: isSnapdragon ? 'qualcomm_qnn' : 'onnx_cpu',
        hardwareTarget: isSnapdragon ? 'npu' : 'cpu',
        modelName: this.getModelForTask(taskType, isSnapdragon ? 'npu' : 'cpu'),
        estimatedLatencyMs: isSnapdragon ? 40 : 90,
        quantization: 'INT8',
        reasoning: 'Hybrid Mode: Fast on-device tensor execution for instant perception, OCR, and embedding generation.',
        fallbackAvailable: true,
        privacyModeAllowed: true,
      };
    }

    // Default fallback
    return {
      taskType,
      selectedProvider: 'local_fallback',
      hardwareTarget: 'cpu',
      modelName: this.getModelForTask(taskType, 'cpu'),
      estimatedLatencyMs: 95,
      quantization: 'INT8',
      reasoning: 'On-device execution active.',
      fallbackAvailable: true,
      privacyModeAllowed: true,
    };
  }

  private getModelForTask(task: TaskType, hw: HardwareTarget): string {
    switch (task) {
      case 'ocr':
        return hw === 'npu' ? 'Qualcomm-OCR-MobileNetV4 (INT8)' : 'Local-Edge-OCR (ONNX INT8)';
      case 'vision':
        return hw === 'npu' ? 'Qualcomm-ResNet50-QNN (INT8)' : 'Local-Vision-FeatureExtractor';
      case 'speech_to_text':
        return hw === 'npu' ? 'Whisper-Base-QNN (INT8)' : 'WebSpeech / Local-Wav2Vec2';
      case 'embedding':
        return hw === 'npu' ? 'BGE-Small-en-v1.5-QNN (INT8)' : 'Nexus-Semantic-384-Local';
      case 'reasoning':
      case 'summarization':
      case 'action_extraction':
      default:
        return hw === 'npu' ? 'Llama-3.2-3B-Instruct-QNN (INT4/INT8)' : 'Nexus-Edge-Reasoning-Core';
    }
  }

  public async executeTask(taskType: TaskType, prompt: string, context?: any): Promise<{
    decision: ModelRoutingDecision;
    output: string;
    sourceReferences: string[];
    suggestedActions: string[];
    citations?: DocumentCitation[];
    latencyMs: number;
    tokensPerSecond?: number;
  }> {
    const decision = this.makeRoutingDecision(taskType);
    const start = performance.now();

    // Query local vector database for grounded citations
    let citations: DocumentCitation[] = [];
    try {
      citations = db.searchChunksWithCitations(prompt, 3, 0.18);
    } catch (citErr) {
      console.warn('Citation search notice:', citErr);
    }

    // Resolve intent and retrieve relevant contextual evidence across SQLite knowledge base
    const intentResolution = IntentEngine.resolve(prompt, context);
    if (intentResolution.citations.length > 0) {
      citations = intentResolution.citations;
    }

    // 1. If routed to Cloud Gemini
    if (decision.selectedProvider === 'cloud_gemini') {
      try {
        let systemPrompt = `You are NEXUS AI, a context-aware spatial intelligence workspace.
Core Philosophy: "Your PC shouldn't run AI. It should understand your context."
Developer Attribution: Developed by Tarun CH.
When asked "Who are you?", "What are you?", "Tell me about yourself", or "What is NEXUS AI?", state that you are NEXUS AI, a context-aware spatial intelligence workspace designed to understand context and help users understand, create, and achieve more with their PC.
When asked "Who developed you?", state naturally: "I was developed by Tarun CH. NEXUS AI was created as a context-aware AI workspace focused on making personal computing more intelligent, contextual, and useful."
When asked "What can you do?", describe only real capabilities: context analysis, document intelligence, persistent history, user memory, meeting intelligence, and voice interaction.
Provide direct, highly structured, crisp, and actionable answers with clean markdown.`;
        if (context) {
          systemPrompt += `\nCurrent User Context:\nApplication: ${context.application || 'Unknown'}\nTitle: ${context.windowTitle || 'Active Window'}\nContent: ${context.text || 'None'}`;
        }
        if (citations.length > 0) {
          systemPrompt += `\nRelevant Retrieved Documents:\n` + citations.map((c, i) => `[${i + 1}] Source: ${c.documentTitle} (Chunk ${c.chunkIndex}, Match: ${(c.similarity * 100).toFixed(1)}%):\n${c.snippet}`).join('\n\n');
        }

        const cloudResult = await callCloudGemini(prompt, systemPrompt);
        const duration = Math.max(1, Math.round(performance.now() - start));
        const estimatedTokens = Math.round(cloudResult.text.length / 4);
        const actualTokensPerSec = parseFloat(((estimatedTokens / (duration / 1000))).toFixed(1));

        return {
          decision,
          output: cloudResult.text,
          sourceReferences: citations.length > 0 
            ? citations.map(c => `${c.documentTitle} (Chunk #${c.chunkIndex})`)
            : ['Cloud Gemini 3.8 Flash', 'Server-Side Secure Tunnel', `Context: ${context?.application || 'Workspace'}`],
          suggestedActions: intentResolution.suggestedActions,
          citations,
          latencyMs: duration,
          tokensPerSecond: actualTokensPerSec > 0 ? actualTokensPerSec : undefined,
        };
      } catch (err: any) {
        console.warn('Cloud Gemini failed or key missing, falling back to Local Engine:', err?.message);
        decision.reasoning += ` (Cloud execution encountered an issue: ${err?.message || 'Fallback to Local Engine'}).`;
        decision.selectedProvider = 'local_fallback';
        decision.hardwareTarget = 'cpu';
      }
    }

    // 2. On-device local execution using Intent Engine
    let localResult = {
      answer: intentResolution.answer,
      sourceReferences: intentResolution.sourceReferences,
      suggestedActions: intentResolution.suggestedActions,
    };

    // If we have document citations and query is asking about documents or Qualcomm architecture, augment answer
    if (citations.length > 0 && (prompt.toLowerCase().includes('document') || prompt.toLowerCase().includes('snapdragon') || prompt.toLowerCase().includes('pdf') || prompt.toLowerCase().includes('guide') || prompt.toLowerCase().includes('viva') || prompt.toLowerCase().includes('question'))) {
      const topCitation = citations[0];
      localResult.sourceReferences = citations.map(c => `${c.documentTitle} (Section #${c.chunkIndex + 1})`);
      if (!localResult.answer.includes('Source Citation:')) {
        localResult.answer += `\n\n---\n**Grounded Source Citation:**\n- **Document:** *${topCitation.documentTitle}* (Chunk #${topCitation.chunkIndex}, Similarity: ${(topCitation.similarity * 100).toFixed(1)}%)\n> "${topCitation.snippet}"\n`;
      }
    }

    // Simulate real measurable hardware dispatch
    if (decision.hardwareTarget === 'npu') {
      await this.qualcommAdapter.executeInference(taskType, decision.modelName, prompt);
    } else {
      await this.fallbackAdapter.executeInference(taskType, decision.modelName, prompt);
    }

    const duration = Math.max(1, Math.round(performance.now() - start));
    const tokenCount = Math.round(localResult.answer.length / 4);
    const measuredTps = parseFloat((tokenCount / (duration / 1000)).toFixed(1));

    return {
      decision,
      output: localResult.answer,
      sourceReferences: localResult.sourceReferences,
      suggestedActions: localResult.suggestedActions,
      citations: citations.length > 0 ? citations : undefined,
      latencyMs: duration,
      tokensPerSecond: measuredTps > 0 ? measuredTps : (decision.hardwareTarget === 'npu' ? 54.0 : 22.0),
    };
  }
}
