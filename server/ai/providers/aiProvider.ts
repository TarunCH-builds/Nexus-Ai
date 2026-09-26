/**
 * NEXUS AI - Provider Abstraction
 * 
 * Allows future providers (Local ONNX, Ollama, OpenAI-compatible) to be plugged in
 * without rewriting the NEXUS core application.
 */

export interface ContextPackage {
  screen?: {
    windowTitle?: string;
    application?: string;
    text?: string;
    ocrConfidence?: number;
    visibleError?: string;
  };
  classification?: any;
  contextSources?: string[];
  documents?: Array<{
    title: string;
    snippet: string;
    chunkIndex?: number;
    similarity?: number;
  }>;
  memory?: Array<{
    title: string;
    content: string;
    category?: string;
  }>;
  meeting?: {
    title: string;
    decisions?: string[];
    transcript?: string;
  };
  knowledge?: Array<{
    subject: string;
    relation: string;
    object: string;
  }>;
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp?: number;
  }>;
  userPrompt?: string;
}

export interface ImagePayload {
  data: string; // Base64 encoded or data URL
  mimeType: string;
}

export interface GenerateOptions {
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  onStatusUpdate?: (status: string) => void;
}

export interface GenerateResult {
  success?: boolean;
  answer: string;
  sources: string[];
  contextUsed: string[];
  provider: string;
  model: string;
  latencyMs: number;
  tokensPerSecond?: number;
  processing: 'cloud' | 'device';
  error?: string;
  fallback_available?: boolean;
}

export interface ProviderHealthStatus {
  provider: string;
  configured: boolean;
  available: boolean;
  model: string;
  last_error: string | null;
  processing: 'cloud' | 'device';
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  readonly processing: 'cloud' | 'device';

  isConfigured(): boolean;
  healthCheck(): Promise<ProviderHealthStatus>;
  testConnection?(): Promise<{
    success: boolean;
    latency_ms: number;
    model: string;
    provider: string;
    error?: string;
    code?: string;
  }>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  generateWithContext(
    prompt: string,
    context: ContextPackage,
    options?: GenerateOptions
  ): Promise<GenerateResult>;
  generateWithImage(
    prompt: string,
    image: ImagePayload,
    context?: ContextPackage,
    options?: GenerateOptions
  ): Promise<GenerateResult>;
  generateStream?(
    prompt: string,
    context?: ContextPackage,
    options?: GenerateOptions,
    onChunk?: (chunk: string) => void
  ): Promise<GenerateResult>;
}
