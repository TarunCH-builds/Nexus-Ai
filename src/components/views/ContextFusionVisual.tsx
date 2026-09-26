/**
 * NEXUS AI - Signature Context Fusion Spatial Topology
 * 
 * Signature Visual Feature:
 * 7 Inputs:
 * - SCREEN
 * - DOCUMENT
 * - MEMORY
 * - VOICE
 * - MEETING
 * - KNOWLEDGE
 * - USER PROMPT
 * 
 * Flowing into: NEXUS CORE -> AI RESPONSE
 * With subtle animated particles traveling along active SVG connections.
 * High-level 6 processing stages:
 * 1. Context captured
 * 2. Sources selected
 * 3. Relevant context retrieved
 * 4. Context fused
 * 5. AI processing
 * 6. Response generated
 */

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  FileText,
  Database,
  Mic,
  Calendar,
  Network,
  Terminal,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Activity,
  Play,
  Check,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ContextObject, SystemHardwareStatus, ProcessingMode } from '../../types/index.js';

interface ContextFusionVisualProps {
  context?: ContextObject;
  hardware?: SystemHardwareStatus;
  processingMode: ProcessingMode;
  onExecutePrompt?: (prompt: string, taskType?: string) => void;
  onNavigate?: (view: string) => void;
  stats?: {
    documentCount: number;
    memoryItemCount: number;
    taskCount: number;
    meetingCount: number;
  };
}

export type FusionStage = 
  | 'idle'
  | 'capturing'
  | 'selecting'
  | 'retrieving'
  | 'fusing'
  | 'processing'
  | 'complete';

export const ContextFusionVisual: React.FC<ContextFusionVisualProps> = ({
  context,
  hardware,
  processingMode,
  onExecutePrompt,
  onNavigate,
  stats,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<FusionStage>('idle');
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [lastFusedSummary, setLastFusedSummary] = useState<string | null>(null);

  // Active state for each of the 7 input streams
  const [activeStreams, setActiveStreams] = useState<Record<string, boolean>>({
    screen: true,
    document: true,
    memory: true,
    voice: true,
    meeting: true,
    knowledge: true,
    prompt: true,
  });

  const toggleStream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStreams(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const inputNodes = [
    {
      id: 'screen',
      name: 'SCREEN',
      label: 'Visual OCR Buffer',
      icon: Monitor,
      color: 'text-sky-400',
      strokeColor: '#38bdf8',
      bgColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      activeColor: 'text-sky-400',
      detail: context?.application ? `${context.application} (${context.windowTitle || 'Active window'})` : 'VS Code terminal / editor buffer',
      metric: 'Sub-50ms local perception',
      view: 'screen',
      weight: '34%',
    },
    {
      id: 'document',
      name: 'DOCUMENT',
      label: 'Vectorized RAG Chunks',
      icon: FileText,
      color: 'text-emerald-400',
      strokeColor: '#34d399',
      bgColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      activeColor: 'text-emerald-400',
      detail: `${stats?.documentCount || 2} indexed documents (384-dim INT8 vectors)`,
      metric: 'Zero-cloud cosine similarity',
      view: 'documents',
      weight: '28%',
    },
    {
      id: 'memory',
      name: 'MEMORY',
      label: 'Episodic User Knowledge',
      icon: Database,
      color: 'text-purple-400',
      strokeColor: '#c084fc',
      bgColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      activeColor: 'text-purple-400',
      detail: `${stats?.memoryItemCount || 3} episodic memory records in SQLite`,
      metric: 'Disk persistent AES store',
      view: 'memory',
      weight: '12%',
    },
    {
      id: 'voice',
      name: 'VOICE',
      label: 'Whisper Audio Buffer',
      icon: Mic,
      color: 'text-amber-400',
      strokeColor: '#fbbf24',
      bgColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      activeColor: 'text-amber-400',
      detail: 'Push-To-Talk & Voice Command stream',
      metric: 'INT8 Whisper perception',
      view: 'meeting',
      weight: '8%',
    },
    {
      id: 'meeting',
      name: 'MEETING',
      label: 'Live Meeting Intelligence',
      icon: Calendar,
      color: 'text-rose-400',
      strokeColor: '#fb7185',
      bgColor: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      activeColor: 'text-rose-400',
      detail: `${stats?.meetingCount || 1} sync session transcript with action items`,
      metric: 'Multi-speaker turn parser',
      view: 'meeting',
      weight: '10%',
    },
    {
      id: 'knowledge',
      name: 'KNOWLEDGE',
      label: 'Dynamic Relationship Graph',
      icon: Network,
      color: 'text-teal-400',
      strokeColor: '#2dd4bf',
      bgColor: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
      activeColor: 'text-teal-400',
      detail: 'Cross-entity links (Snapdragon, QNN, Tasks, Whiteboard)',
      metric: 'Topological semantic graph',
      view: 'knowledge',
      weight: '5%',
    },
    {
      id: 'prompt',
      name: 'USER PROMPT',
      label: 'Natural Language Query',
      icon: Terminal,
      color: 'text-indigo-400',
      strokeColor: '#818cf8',
      bgColor: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      activeColor: 'text-indigo-400',
      detail: 'Interactive command line directives and intent parsing',
      metric: 'Direct dispatch trigger',
      view: 'home',
      weight: '3%',
    },
  ];

  const stagesList = [
    { key: 'capturing', label: '1. Context Captured', desc: 'Acquiring active screen, audio, and prompt inputs' },
    { key: 'selecting', label: '2. Sources Selected', desc: 'Filtering permitted streams based on privacy policy' },
    { key: 'retrieving', label: '3. Relevant Context Retrieved', desc: 'Vector cosine search over local chunks and memories' },
    { key: 'fusing', label: '4. Context Fused', desc: 'Assembling unified spatial context payload' },
    { key: 'processing', label: '5. AI Processing', desc: hardware?.isSnapdragon ? 'Inference via Hexagon NPU (QNN)' : 'Local CPU SIMD inference' },
    { key: 'complete', label: '6. Response Generated', desc: 'Synthesized grounded answer with citations' },
  ];

  const runFusionCycle = () => {
    if (currentStage !== 'idle' && currentStage !== 'complete') return;
    
    setCurrentStage('capturing');
    setStageProgress(15);

    setTimeout(() => {
      setCurrentStage('selecting');
      setStageProgress(35);
    }, 450);

    setTimeout(() => {
      setCurrentStage('retrieving');
      setStageProgress(55);
    }, 900);

    setTimeout(() => {
      setCurrentStage('fusing');
      setStageProgress(75);
    }, 1350);

    setTimeout(() => {
      setCurrentStage('processing');
      setStageProgress(90);
    }, 1800);

    setTimeout(() => {
      setCurrentStage('complete');
      setStageProgress(100);
      const activeCount = Object.values(activeStreams).filter(Boolean).length;
      setLastFusedSummary(`Fused ${activeCount} active streams into verified response. Target: Local-First execution.`);
      if (onExecutePrompt) {
        onExecutePrompt('Synthesize my active screen context, indexed architecture guide, and recent team decisions into an actionable summary.');
      }
    }, 2300);
  };

  const selectedNode = inputNodes.find(n => n.id === selectedNodeId);

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0f18]/85 backdrop-blur-md p-4 sm:p-5 relative overflow-hidden space-y-4 shadow-xl">
      {/* Dynamic Background Grid Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent" />

      {/* Top Header & Stage Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <div className="absolute w-4 h-4 rounded-full bg-cyan-400/30 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-100 tracking-wide">
                CONTEXT FUSION
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                SIGNATURE SPATIAL TOPOLOGY
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-white/[0.05]">
                {processingMode.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runFusionCycle}
            disabled={currentStage !== 'idle' && currentStage !== 'complete'}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{currentStage === 'idle' || currentStage === 'complete' ? 'Trigger Context Fusion' : 'Fusing Context...'}</span>
          </button>
        </div>
      </div>

      {/* High-Level 6 Processing Stages Bar */}
      <div className="p-3 rounded-lg bg-neutral-950/70 border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Fusion Pipeline Execution Stages
          </span>
          <span className="font-mono text-cyan-400 font-semibold">
            {currentStage === 'idle' ? 'Ready for input' : currentStage === 'complete' ? 'Stage 6/6 Complete' : `Processing: ${currentStage.toUpperCase()}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 pt-1">
          {stagesList.map((stage, idx) => {
            const isActive = currentStage === stage.key;
            const isPast = (
              (stage.key === 'capturing' && ['selecting', 'retrieving', 'fusing', 'processing', 'complete'].includes(currentStage)) ||
              (stage.key === 'selecting' && ['retrieving', 'fusing', 'processing', 'complete'].includes(currentStage)) ||
              (stage.key === 'retrieving' && ['fusing', 'processing', 'complete'].includes(currentStage)) ||
              (stage.key === 'fusing' && ['processing', 'complete'].includes(currentStage)) ||
              (stage.key === 'processing' && currentStage === 'complete') ||
              (stage.key === 'complete' && currentStage === 'complete')
            );

            return (
              <div
                key={stage.key}
                className={`p-1.5 rounded border transition-all text-left ${
                  isActive
                    ? 'bg-indigo-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/40'
                    : isPast
                    ? 'bg-neutral-900/90 border-emerald-500/30 text-emerald-300'
                    : 'bg-neutral-900/40 border-white/[0.04] text-neutral-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-semibold">
                  <span className="truncate">{stage.label}</span>
                  {isPast ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Animated Spatial Topology Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center relative py-2">
        {/* Left Column: 7 Context Source Streams (Cols 1-4) */}
        <div className="md:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 uppercase tracking-wider px-1">
            <span>7 Multimodal Streams</span>
            <span className="text-neutral-500">Toggle stream</span>
          </div>

          {inputNodes.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNodeId === node.id;
            const isActive = activeStreams[node.id];

            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                className={`p-2 rounded-lg border transition-all cursor-pointer text-left relative group ${
                  isSelected
                    ? 'bg-neutral-800/95 border-cyan-400 shadow-md ring-1 ring-cyan-400/30'
                    : isActive
                    ? 'bg-[#111522]/90 border-white/[0.07] hover:border-white/[0.18] hover:bg-[#151a2b]'
                    : 'bg-neutral-900/40 border-white/[0.03] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleStream(node.id, e)}
                      title={isActive ? 'Disable stream' : 'Enable stream'}
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] transition-colors ${
                        isActive ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-neutral-700 bg-neutral-800'
                      }`}
                    >
                      {isActive && <Check className="w-2.5 h-2.5" />}
                    </button>

                    <div className={`p-1 rounded ${node.bgColor}`}>
                      <Icon className="w-3 h-3" />
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                        <span>{node.name}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[140px] sm:max-w-[180px]">
                        {node.label}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-950/80 px-1.5 py-0.5 rounded border border-white/[0.05]">
                    {node.weight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center: Dynamic Animated SVG Conduit + NEXUS CORE (Cols 5-8) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-2 text-center relative">
          {/* Animated SVG Bus Streams */}
          <div className="w-full flex items-center justify-center my-1 relative">
            <svg className="w-full h-16 overflow-visible" viewBox="0 0 240 60">
              <defs>
                <linearGradient id="streamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#6366f1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Connecting curves from 7 inputs into Core */}
              <path
                d="M 10 10 C 60 10, 80 30, 120 30"
                fill="none"
                stroke="url(#streamGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="opacity-70 animate-pulse"
              />
              <path
                d="M 10 30 C 60 30, 80 30, 120 30"
                fill="none"
                stroke="url(#streamGrad)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                d="M 10 50 C 60 50, 80 30, 120 30"
                fill="none"
                stroke="url(#streamGrad)"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="opacity-70 animate-pulse"
              />

              {/* Center target knot */}
              <circle cx="120" cy="30" r="4" fill="#6366f1" />
              <circle cx="120" cy="30" r="7" fill="none" stroke="#818cf8" strokeWidth="1" className="animate-ping" />

              {/* Right outflow into AI Response */}
              <path
                d="M 120 30 C 160 30, 180 30, 230 30"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="5 3"
              />
            </svg>
          </div>

          {/* NEXUS CORE NODE */}
          <div
            onClick={() => setSelectedNodeId(selectedNodeId === 'core' ? null : 'core')}
            className={`w-full max-w-[230px] p-4 rounded-xl border transition-all cursor-pointer relative shadow-lg ${
              selectedNodeId === 'core'
                ? 'bg-neutral-800 border-indigo-400 shadow-indigo-500/20 ring-1 ring-indigo-400/40'
                : 'bg-gradient-to-b from-[#14182a] to-[#0d101d] border-indigo-500/40 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-indigo-400 mb-1">
              <Cpu className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-neutral-100">NEXUS CORE</span>
            </div>
            <div className="text-[10px] text-neutral-300 font-mono">
              Multimodal Context Fusion Engine
            </div>
            <div className="mt-2 text-[9px] font-mono text-cyan-300 bg-neutral-950/80 py-1 px-2 rounded border border-indigo-500/30 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>{hardware?.isSnapdragon ? 'Qualcomm Hexagon NPU (QNN)' : 'Local CPU Vector Engine (SIMD)'}</span>
            </div>
          </div>

          <div className="text-[9px] font-mono text-neutral-400 mt-2 flex items-center gap-1">
            <span>Flow Rate: Sub-50ms target</span>
            <span className="text-indigo-400">→</span>
          </div>
        </div>

        {/* Right Column: AI RESPONSE & Output Verification (Cols 9-12) */}
        <div className="md:col-span-4 space-y-2">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider px-1">
            Synthesized AI Output
          </div>

          <div
            onClick={() => setSelectedNodeId(selectedNodeId === 'response' ? null : 'response')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedNodeId === 'response'
                ? 'bg-neutral-800 border-emerald-400 shadow-md ring-1 ring-emerald-400/30'
                : 'bg-[#111624]/90 border-emerald-500/30 hover:border-emerald-500/50 hover:bg-[#141a2c]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>AI RESPONSE</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                LOCAL-FIRST
              </span>
            </div>

            <div className="text-[11px] text-neutral-300 font-sans leading-relaxed">
              {lastFusedSummary || 'Multi-source contextual response generated with explicit source citations and safe execution actions.'}
            </div>

            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-neutral-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Zero Cloud Egress
              </span>
              <span>Audited in SQLite</span>
            </div>
          </div>

          {/* Quick Navigate to view */}
          {selectedNode && onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate(selectedNode.view)}
              className="w-full text-center px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Inspect {selectedNode.name} Repository</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            </button>
          )}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNodeId && (
        <div className="p-3.5 rounded-lg bg-neutral-950/95 border border-white/[0.08] text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
            <span className="font-semibold text-neutral-200 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {selectedNodeId === 'core'
                  ? 'NEXUS CORE: Hardware Routing & Vector Synthesis'
                  : selectedNodeId === 'response'
                  ? 'AI RESPONSE: Execution & Audit Record'
                  : `Context Stream: ${selectedNode?.name} (${selectedNode?.label})`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="text-[10px] text-neutral-400 hover:text-neutral-200 font-mono"
            >
              [close]
            </button>
          </div>

          <div className="text-neutral-300 text-[11px] leading-relaxed">
            {selectedNodeId === 'core' ? (
              <p>
                The NEXUS Core Model Router continuously harmonizes active window perception, indexed vector chunks, episodic memory, and user directives.
                When deployed on Snapdragon X Elite, tensors are compiled for Qualcomm Hexagon NPU using INT8 quantization via QNN Execution Provider.
              </p>
            ) : selectedNodeId === 'response' ? (
              <p>
                Responses are generated on-device with zero cloud telemetry. Each answer references grounded citations and records an unalterable audit log entry in the persistent SQLite database.
              </p>
            ) : (
              <div className="space-y-1">
                <p>
                  Active Detail: <strong className="text-neutral-200">{selectedNode?.detail}</strong>
                </p>
                <p className="text-neutral-400">
                  Performance Metric: {selectedNode?.metric} · Relative Context Weight: {selectedNode?.weight}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
