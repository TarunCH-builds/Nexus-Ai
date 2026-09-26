/**
 * NEXUS AI - Core Type Definitions
 * Windows on Snapdragon AI Lab Build & Present Challenge
 */

export type ProcessingMode = 'local' | 'hybrid' | 'cloud';

export type TaskType = 
  | 'reasoning'
  | 'ocr'
  | 'vision'
  | 'speech_to_text'
  | 'text_to_speech'
  | 'embedding'
  | 'summarization'
  | 'action_extraction';

export type HardwareTarget = 'npu' | 'gpu' | 'cpu' | 'cloud';

export interface SystemHardwareStatus {
  platform: string;
  architecture: string;
  isSnapdragon: boolean;
  processorName: string;
  cpuCores?: number;
  npuAvailable: boolean;
  npuName?: string;
  npuTops?: number;
  qnnRuntimeVersion?: string;
  onnxQnnEpAvailable: boolean;
  directMLAvailable: boolean;
  totalMemoryMb: number;
  availableMemoryMb: number;
  activeProvider: HardwareTarget;
  fallbackReason?: string;
}

export interface ContextObject {
  id: string;
  timestamp: number;
  sourceType: 'screen' | 'document' | 'voice' | 'clipboard' | 'manual';
  application?: string;
  windowTitle?: string;
  text: string;
  visualElements?: Array<{
    type: 'text_box' | 'code_block' | 'diagram' | 'button' | 'table';
    content: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }>;
  visualTokens?: Array<{
    id?: string;
    type?: string;
    content?: string;
    bbox?: number[];
  }>;
  detectedLanguage?: string;
  documentMetadata?: {
    filename?: string;
    mimeType?: string;
    pageCount?: number;
    author?: string;
  };
  confidence: number;
  privacyLevel: 'local_only' | 'sensitive' | 'general';
}

export interface ModelRoutingDecision {
  taskType: TaskType;
  selectedProvider: 'qualcomm_qnn' | 'onnx_cpu' | 'directml' | 'cloud_gemini' | 'local_fallback';
  hardwareTarget: HardwareTarget;
  modelName: string;
  estimatedLatencyMs: number;
  quantization: 'INT8' | 'INT4' | 'FP16' | 'FP32' | 'Cloud';
  reasoning: string;
  fallbackAvailable: boolean;
  privacyModeAllowed: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: number;
  chunkCount: number;
  summary?: string;
  extractedConcepts: string[];
  chunks?: DocumentChunk[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface MemoryItem {
  id: string;
  category: 'document' | 'meeting' | 'note' | 'task' | 'code' | 'context' | 'project';
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  sourceId?: string;
  privacyLevel: 'local_only' | 'general';
  embedding?: number[];
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
  source: 'meeting' | 'screen' | 'document' | 'manual';
  sourceTitle?: string;
  dueDate?: string;
  assignee?: string;
  createdAt: number;
  completedAt?: number;
  estimatedMinutes?: number;
  command?: string;
}

export interface MeetingSession {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  status: 'live' | 'completed';
  date?: string;
  participants?: string[];
  transcript: Array<{
    id: string;
    speaker: string;
    timestamp: number;
    text: string;
  }>;
  summary?: string;
  keyPoints: string[];
  decisions: string[];
  keyDecisions?: string[];
  actionItems: TaskItem[];
}

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  taskType: TaskType;
  modelName: string;
  hardwareTarget: HardwareTarget;
  executionProvider: string;
  latencyMs: number;
  inputTokenCount?: number;
  outputTokenCount?: number;
  tokensPerSecond?: number;
  memoryUsageMb: number;
  success: boolean;
  workload?: string;
  throughput?: string;
  provider?: string;
}

export interface PrivacyAuditRecord {
  id: string;
  timestamp: number;
  action: string;
  destination: 'on_device_npu' | 'on_device_cpu' | 'cloud_gemini';
  dataSummary: string;
  privacyScore?: number;
  dataEgress?: 'none' | 'cloud_gemini';
  encryptionStatus?: string;
  userApproved: boolean;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ActionProposal {
  id: string;
  title: string;
  actionType?: string;
  command?: string;
  description: string;
  reason: string;
  source: 'screen' | 'document' | 'meeting' | 'prompt' | 'manual';
  sourceTitle?: string;
  riskLevel: RiskLevel;
  sandboxStatus: 'verified' | 'sandboxed' | 'blocked' | 'requires_elevation';
  safetyViolations: string[];
  userApproved: boolean;
  executed: boolean;
  createdAt: number;
  executedAt?: number;
  outputResult?: string;
}

export interface DocumentCitation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  chunkId: string;
  similarity: number;
  snippet: string;
}

export interface HardwareRuntimeSpec {
  device: string;
  operatingSystem: string;
  architecture: string;
  cpu: string;
  gpu: string;
  npu: string;
  npuStatus: 'DETECTED' | 'AVAILABLE' | 'NOT DETECTED' | 'UNAVAILABLE' | 'TARGET PROFILE';
  memory: string;
  aiRuntime: string;
  executionProvider: string;
  isSnapdragonTarget: boolean;
  targetHardwareLabel: string;
}

export type CommandExecutionState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'CONNECTING'
  | 'ANALYZING' 
  | 'RETRIEVING' 
  | 'PROCESSING' 
  | 'STREAMING'
  | 'COMPLETE' 
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'ERROR'
  | 'OFFLINE';

export interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'document' | 'concept' | 'meeting' | 'task' | 'note' | 'person' | 'topic';
  size?: number;
  color?: string;
  source?: string;
  relationship?: string;
  timestamp?: number;
  confidence?: number;
  description?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
}

export interface UserResponse {
  answer: string;
  sources: string[];
  suggestedActions: string[];
  citations?: DocumentCitation[];
}

export interface ProcessingMetadata {
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

export interface ChatResponse {
  success: boolean;
  answer: string;
  intent?: string;
  contextUsed?: string[];
  userResponse?: UserResponse;
  processingMetadata?: ProcessingMetadata;
  metadata?: {
    runtime: string;
    model: string;
    latencyMs: number;
  };
  decision: ModelRoutingDecision;
  sourceReferences: string[];
  suggestedActions: string[];
  citations?: DocumentCitation[];
  latencyMs: number;
  tokensPerSecond?: number;
  securityCheck?: {
    status: 'PASS' | 'BLOCKED' | 'NEEDS_CONFIRMATION';
    threats?: string[];
    reason?: string;
  };
  error?: {
    code: string;
    message: string;
  } | null;
}

export interface IRealSystemTelemetry {
  timestamp: number;
  cpu: {
    model: string;
    cores: number;
    usagePercent: number;
    architecture: string;
  };
  memory: {
    processRssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    systemTotalMb: number;
    systemFreeMb: number;
    systemUsedPercent: number;
  };
  accelerator: {
    npuStatus: string;
    npuAccelerationActive: boolean;
    npuTargetPlatform: string;
    gpuStatus: string;
    gpuUtilization: string;
    directMLAvailable: boolean;
    qnnDriverPresent: boolean;
  };
  measuredBenchmarks: {
    modelLoadTimeMs: number;
    embeddingLatencyMs: number;
    embeddingThroughputPerSec: number;
    ocrLatencyMs: number;
    documentProcessingTimeMs: number;
    inferenceLatencyMs: number;
    simulatedOrReal: 'REAL_CPU_MEASURED' | 'REAL_NPU_MEASURED';
  };
}

export interface IQualcommHubModel {
  id: string;
  name: string;
  category: 'LLM' | 'Vision' | 'Audio' | 'Embedding' | 'Detection';
  architecture: string;
  parameters: string;
  quantization: 'INT4' | 'INT8' | 'FP16';
  qualcommHubId: string;
  supportedRuntimes: ('QNN' | 'ONNX-QNN' | 'DirectML' | 'TFLite' | 'CPU-Fallback')[];
  minNpuTops: number;
  memoryRequirementMb: number;
  typicalNpuLatencyMs: number;
  currentHostCompatibility: {
    status: 'native_accelerated' | 'cpu_fallback' | 'unsupported';
    runtimeInUse: string;
    accelerationActive: boolean;
    verificationNotes: string;
  };
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRatio: number;
  totalEntries: number;
  memorySavedBytes: number;
}

// User Authentication & Profile Types
export interface UserPreferences {
  historyRetention?: 'forever' | '30_days' | '90_days' | '1_year';
  memoryEnabled?: boolean;
  autoCaptureScreen?: boolean;
  theme?: string;
  retentionDays?: number;
  localOnly?: boolean;
  telemetryOptIn?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt: number;
  preferences?: UserPreferences;
}

export interface WorkspaceStats {
  conversations: number;
  documents: number;
  meetings: number;
  memories: number;
  tasks: number;
  storageUsageBytes: number;
  memberSince: number;
}

