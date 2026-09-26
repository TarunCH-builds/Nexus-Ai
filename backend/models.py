"""
NEXUS AI - FastAPI Domain Schemas (Pydantic V2)
Strict typed schemas matching frontend TypeScript contracts.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

ProcessingMode = Literal['local', 'hybrid', 'cloud']
HardwareTarget = Literal['npu', 'gpu', 'cpu', 'cloud']
TaskType = Literal['reasoning', 'ocr', 'vision', 'speech_to_text', 'text_to_speech', 'embedding', 'summarization', 'action_extraction']

class SystemHardwareStatus(BaseModel):
    platform: str
    architecture: str
    cpuCores: Optional[int] = None
    isSnapdragon: bool
    processorName: str
    npuAvailable: bool
    npuName: Optional[str] = None
    npuTops: Optional[int] = None
    qnnRuntimeVersion: Optional[str] = None
    onnxQnnEpAvailable: bool
    directMLAvailable: bool
    totalMemoryMb: int
    availableMemoryMb: int
    activeProvider: HardwareTarget
    fallbackReason: Optional[str] = None

class ContextObject(BaseModel):
    id: str
    timestamp: int
    sourceType: Literal['screen', 'document', 'voice', 'clipboard', 'manual']
    application: Optional[str] = None
    windowTitle: Optional[str] = None
    text: str
    visualElements: Optional[List[Dict[str, Any]]] = None

class DocumentChunk(BaseModel):
    id: str
    documentId: str
    chunkIndex: int
    text: str
    tokenCount: int
    embedding: List[float]

class DocumentItem(BaseModel):
    id: str
    title: str
    fileName: str
    fileSize: int
    mimeType: str
    createdAt: int
    chunkCount: int
    summary: Optional[str] = None
    extractedConcepts: List[str] = Field(default_factory=list)
    chunks: Optional[List[DocumentChunk]] = None

class MemoryItem(BaseModel):
    id: str
    category: Literal['code', 'project', 'meeting', 'note', 'concept']
    title: str
    content: str
    tags: List[str] = Field(default_factory=list)
    createdAt: int
    privacyLevel: Literal['local_only', 'encrypted_sync', 'shared'] = 'local_only'
    embedding: Optional[List[float]] = None

class TaskItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: Literal['pending', 'in_progress', 'completed', 'dismissed'] = 'pending'
    priority: Literal['low', 'medium', 'high'] = 'medium'
    createdAt: int
    completedAt: Optional[int] = None
    source: Literal['screen', 'document', 'meeting', 'manual'] = 'manual'
    sourceTitle: Optional[str] = None
    estimatedMinutes: Optional[int] = None
    command: Optional[str] = None

class MeetingSession(BaseModel):
    id: str
    title: str
    date: int
    durationSeconds: int
    participants: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    actionItems: List[str] = Field(default_factory=list)
    keyDecisions: List[str] = Field(default_factory=list)
    transcript: Optional[str] = None

class PerformanceMetric(BaseModel):
    id: str
    timestamp: int
    workload: str
    latencyMs: float
    throughput: Optional[str] = None
    provider: str
    hardwareTarget: HardwareTarget

class PrivacyAuditRecord(BaseModel):
    id: str
    timestamp: int
    action: str
    destination: Literal['on_device_npu', 'on_device_cpu', 'cloud_gemini']
    dataSummary: str
    privacyScore: int
    userApproved: bool

class ChatRequest(BaseModel):
    prompt: str
    taskType: Optional[TaskType] = 'reasoning'
    includeContext: bool = True
