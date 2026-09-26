/**
 * NEXUS AI - Module 1: Spatial Intelligence Workspace Dashboard
 * Refined competition-grade desktop interface featuring the Hero Command Center,
 * Live Current Context modules, and interactive Context Fusion Topology.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  FileText,
  Database,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Mic,
  Command,
  Terminal,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  Lock,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  Pin,
  Eye,
  EyeOff,
  Sliders,
  RotateCcw,
  Radio,
  Volume2,
} from 'lucide-react';
import { ContextObject, SystemHardwareStatus, ProcessingMode } from '../../types/index.js';
import { ContextFusionVisual } from './ContextFusionVisual.js';
import { HardwareRuntimePanel } from '../hardware/HardwareRuntimePanel.js';
import { useApp } from '../../context/AppContext.js';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext.js';
import { api } from '../../services/api.js';

interface PanelConfig {
  id: 'context-fusion' | 'current-context' | 'hardware-runtime' | 'instant-workflows';
  title: string;
  collapsed: boolean;
  pinned: boolean;
  hidden: boolean;
}

const DEFAULT_PANELS: PanelConfig[] = [
  { id: 'context-fusion', title: 'Context Fusion Matrix', collapsed: false, pinned: false, hidden: false },
  { id: 'current-context', title: 'Current Context Stream', collapsed: false, pinned: false, hidden: false },
  { id: 'hardware-runtime', title: 'Hardware Runtime & Execution Diagnostics', collapsed: false, pinned: false, hidden: false },
  { id: 'instant-workflows', title: 'Instant Intelligence Workflows', collapsed: false, pinned: false, hidden: false },
];

interface NexusHomeProps {
  onNavigate: (view: string) => void;
  onExecutePrompt: (prompt: string, taskType?: string) => void;
  context?: ContextObject;
  hardware?: SystemHardwareStatus;
  processingMode: ProcessingMode;
  stats?: {
    documentCount: number;
    memoryItemCount: number;
    taskCount: number;
    meetingCount: number;
  };
}

export const NexusHome: React.FC<NexusHomeProps> = ({
  onNavigate,
  onExecutePrompt,
  context,
  hardware,
  processingMode,
  stats,
}) => {
  const { user, stats: workspaceStats } = useApp();
  const {
    state: voiceState,
    startListening: startVoiceSession,
    interrupt: interruptVoice,
    setIsOrbExpanded,
    settings: voiceSettings,
    interimTranscript,
    audioLevels,
  } = useVoiceAssistant();

  const [quickInput, setQuickInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentConversations, setRecentConversations] = useState<any[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [recentMemories, setRecentMemories] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function loadRecentActivity() {
      try {
        const [convRes, docRes, mtgRes, memRes] = await Promise.all([
          api.getConversations(),
          api.getDocuments(),
          api.getMeetings(),
          api.getMemory(),
        ]);
        if (mounted) {
          setRecentConversations(convRes.conversations?.slice(0, 3) || []);
          setRecentDocuments(docRes.documents?.slice(0, 3) || []);
          setRecentMeetings(mtgRes.meetings?.slice(0, 3) || []);
          setRecentMemories(memRes.items?.slice(0, 3) || []);
        }
      } catch (err) {
        console.warn('Error loading recent activity:', err);
      }
    }
    loadRecentActivity();
    return () => { mounted = false; };
  }, [user]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!user || !user.name) return 'Engineer';
    return user.name.split(' ')[0];
  };
  const [showLayoutDrawer, setShowLayoutDrawer] = useState(false);

  const handleMicClick = () => {
    if (voiceState === 'LISTENING' || voiceState === 'RESPONDING') {
      interruptVoice();
    } else {
      setIsOrbExpanded(true);
      startVoiceSession(true);
    }
  };

  const [panels, setPanels] = useState<PanelConfig[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_dashboard_panels_layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_PANELS.length) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_PANELS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexus_dashboard_panels_layout', JSON.stringify(panels));
    } catch {}
  }, [panels]);

  const movePanel = (id: string, direction: 'up' | 'down') => {
    setPanels((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const toggleCollapse = (id: string) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, collapsed: !p.collapsed } : p)));
  };

  const togglePin = (id: string) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  };

  const toggleHide = (id: string) => {
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p)));
  };

  const resetPanels = () => {
    setPanels(DEFAULT_PANELS);
  };

  const sortedPanels = [...panels].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const handleQuickSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    const target = quickInput.trim() || interimTranscript.trim();
    if (!target) return;
    try {
      setIsSubmitting(true);
      await onExecutePrompt(target);
      setQuickInput('');
    } catch (err) {
      console.warn('Execution notice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickActions = [
    {
      title: 'Context & Vision',
      desc: 'Active screen OCR, visual token segmentation, and error diagnosis',
      icon: Monitor,
      action: () => onNavigate('screen'),
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    },
    {
      title: 'Documents & RAG',
      desc: 'Local chunking, 384-dim INT8 embeddings, and offline research search',
      icon: FileText,
      action: () => onNavigate('documents'),
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Local Memory Store',
      desc: 'Zero-cloud vector database, knowledge nodes, and semantic recall',
      icon: Database,
      action: () => onNavigate('memory'),
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Meeting Intelligence',
      desc: 'Whisper voice transcription, speaker diarization, and decision logger',
      icon: Users,
      action: () => onNavigate('meeting'),
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'AI Performance Lab',
      desc: 'Real measured hardware latency, CPU Float32 SIMD, and NPU metrics',
      icon: Cpu,
      action: () => onNavigate('performance'),
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      title: 'Zero-Leak Privacy',
      desc: 'Enforce cryptographic local boundaries and inspect audit trail',
      icon: ShieldCheck,
      action: () => onNavigate('privacy'),
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
  ];


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. HERO AREA & PRIMARY COMMAND INTERFACE */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#111522]/90 to-[#0c0e17]/90 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden shadow-2xl space-y-6">
        {/* Subtle decorative edge lighting */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {getTimeGreeting()}, {getFirstName()}.
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/10 text-cyan-400 border border-indigo-500/25">
                Personal Workspace
              </span>
            </div>
            <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-2xl">
              &ldquo;Your PC shouldn't just run AI. It should understand your context.&rdquo;
            </p>
          </div>

          {/* Active app context chip */}
          <div className="flex items-center gap-2 text-xs font-mono bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-white/[0.08] shrink-0 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-subtle-pulse" />
            <span className="text-neutral-400">Context:</span>
            <span className="font-semibold text-neutral-200">
              {context?.application || 'Visual Studio Code'}
            </span>
          </div>
        </div>

        {/* YOUR NEXUS ACTIVITY COMPACT STRIP */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-2.5">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Activity className="w-3.5 h-3.5" />
              Your NEXUS Activity
            </span>
            <span className="text-neutral-500 font-sans normal-case text-[10px]">
              Authenticated user-isolated storage
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {/* Recent Conversations */}
            <div 
              onClick={() => onNavigate('history')}
              className="p-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-850/80 border border-white/[0.06] hover:border-cyan-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Recent Chats
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 rounded">
                  {workspaceStats?.conversations ?? recentConversations.length}
                </span>
              </div>
              {recentConversations.length > 0 ? (
                <div className="space-y-1">
                  {recentConversations.slice(0, 2).map((c) => (
                    <div key={c.id} className="text-neutral-300 group-hover:text-white truncate text-[11px]">
                      • {c.title || 'Conversation'}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 italic">No conversations yet</div>
              )}
            </div>

            {/* Recent Documents */}
            <div 
              onClick={() => onNavigate('documents')}
              className="p-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-850/80 border border-white/[0.06] hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5 text-[11px]">
                  <FileText className="w-3 h-3 text-emerald-400" />
                  Recent Documents
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 rounded">
                  {workspaceStats?.documents ?? recentDocuments.length}
                </span>
              </div>
              {recentDocuments.length > 0 ? (
                <div className="space-y-1">
                  {recentDocuments.slice(0, 2).map((d) => (
                    <div key={d.id} className="text-neutral-300 group-hover:text-white truncate text-[11px]">
                      • {d.title || d.fileName}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 italic">No documents indexed</div>
              )}
            </div>

            {/* Recent Meetings */}
            <div 
              onClick={() => onNavigate('meeting')}
              className="p-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-850/80 border border-white/[0.06] hover:border-amber-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5 text-[11px]">
                  <Users className="w-3 h-3 text-amber-400" />
                  Recent Meetings
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 rounded">
                  {workspaceStats?.meetings ?? recentMeetings.length}
                </span>
              </div>
              {recentMeetings.length > 0 ? (
                <div className="space-y-1">
                  {recentMeetings.slice(0, 2).map((m) => (
                    <div key={m.id} className="text-neutral-300 group-hover:text-white truncate text-[11px]">
                      • {m.title}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 italic">No meetings logged</div>
              )}
            </div>

            {/* Saved Memories */}
            <div 
              onClick={() => onNavigate('memory')}
              className="p-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-850/80 border border-white/[0.06] hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-neutral-400 font-medium flex items-center gap-1.5 text-[11px]">
                  <Database className="w-3 h-3 text-purple-400" />
                  Saved Memories
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 rounded">
                  {workspaceStats?.memories ?? recentMemories.length}
                </span>
              </div>
              {recentMemories.length > 0 ? (
                <div className="space-y-1">
                  {recentMemories.slice(0, 2).map((mem) => (
                    <div key={mem.id} className="text-neutral-300 group-hover:text-white truncate text-[11px]">
                      • {mem.title}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-neutral-500 italic">No memories saved</div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Command Input Interface */}
        <form onSubmit={handleQuickSubmit} className="relative group">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none transition-colors group-focus-within:text-cyan-400" />
            <input
              type="text"
              id="nexus-chat-input"
              name="nexus-chat-input"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickSubmit(e);
                }
              }}
              placeholder={
                voiceState === 'LISTENING'
                  ? (interimTranscript ? `Listening: "${interimTranscript}..."` : "Listening... Speak now or say 'Hey NEXUS'...")
                  : "Ask NEXUS anything (e.g. 'Hello NEXUS', 'What is artificial intelligence?')..."
              }
              className="w-full bg-[#080a10]/90 border border-white/[0.1] group-hover:border-white/[0.2] focus:border-indigo-500/70 rounded-xl py-3.5 pl-11 pr-28 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all font-sans"
            />
            {/* Right Command Actions (Mic + Shortcut + Submit) */}
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleMicClick}
                title={
                  voiceState === 'LISTENING'
                    ? 'Stop listening'
                    : voiceState === 'RESPONDING'
                    ? 'Interrupt speaking'
                    : voiceSettings.wakeWordEnabled
                    ? 'Push to speak (or say "Hey NEXUS")'
                    : 'Push to speak'
                }
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  voiceState === 'LISTENING'
                    ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-400 ring-2 ring-emerald-500/30 animate-pulse'
                    : voiceState === 'RESPONDING'
                    ? 'bg-cyan-500/20 border border-cyan-500/60 text-cyan-400 ring-2 ring-cyan-500/30 animate-pulse'
                    : voiceState === 'THINKING'
                    ? 'bg-indigo-500/20 border border-indigo-500/60 text-indigo-400 animate-spin'
                    : 'bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {voiceState === 'RESPONDING' ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : voiceState === 'LISTENING' ? (
                  <Radio className="w-3.5 h-3.5" />
                ) : (
                  <Mic className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || (!quickInput.trim() && !interimTranscript.trim())}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                aria-label="Send message"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/60 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>Ask</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Listening Waveform Banner */}
          {voiceState === 'LISTENING' && (
            <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-amber-950/30 to-cyan-950/40 border border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping absolute opacity-75" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 relative z-10" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 font-mono">
                    <span>ACTIVE VOICE LISTENING</span>
                    <span className="text-[10px] text-neutral-400 font-sans">· Web Speech API</span>
                  </div>
                  <div className="text-xs text-cyan-300 italic truncate max-w-xs sm:max-w-sm mt-0.5">
                    {interimTranscript ? `"${interimTranscript}..."` : 'Speak into your microphone...'}
                  </div>
                </div>
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="flex items-center gap-1 bg-black/60 px-3 py-1.5 rounded-xl border border-white/[0.08] shadow-inner">
                {audioLevels.map((height: number, i: number) => (
                  <div
                    key={i}
                    className="w-1 rounded-full transition-all duration-75 bg-gradient-to-t from-cyan-500 via-teal-400 to-amber-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = (quickInput + ' ' + interimTranscript).trim();
                    interruptVoice();
                    if (target) {
                      onExecutePrompt(target);
                      setQuickInput('');
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Execute</span>
                </button>
                <button
                  type="button"
                  onClick={interruptVoice}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/[0.08] text-neutral-300 text-xs transition-colors cursor-pointer"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-2">
            <div className="flex items-center gap-2">
              <span>Quick Prompt:</span>
              <button
                type="button"
                onClick={() => onExecutePrompt('Explain what is wrong on my screen right now')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-dotted"
              >
                Diagnose screen error
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onExecutePrompt('Synthesize study notes from my indexed whitepapers')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-dotted"
              >
                Synthesize document notes
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px]">
              <span>Command Palette:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-white/[0.1] text-neutral-400">
                Ctrl + K
              </kbd>
            </div>
          </div>
        </form>
      </div>

      {/* WORKSPACE LAYOUT CUSTOMIZATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-neutral-300">Spatial Intelligence Modules</span>
          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 border border-white/[0.06] px-1.5 py-0.5 rounded">
            Persistent Order
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLayoutDrawer(!showLayoutDrawer)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-white/[0.08] text-[11px] font-medium text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Customize Panels ({panels.filter((p) => !p.hidden).length}/{panels.length})</span>
          </button>
          <button
            type="button"
            onClick={resetPanels}
            title="Reset to default workspace arrangement"
            className="p-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-white/[0.08] text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* DRAWER: PANEL VISIBILITY & RESET */}
      {showLayoutDrawer && (
        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-[#0c0f18] space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-200">
            <span>Toggle Active Workspace Panels</span>
            <span className="text-[10px] font-mono text-neutral-500">Auto-saved to LocalStorage</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {panels.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/70 border border-white/[0.05] text-xs"
              >
                <span className="text-neutral-300 truncate font-medium">{p.title}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => togglePin(p.id)}
                    title={p.pinned ? 'Unpin' : 'Pin to top'}
                    className={`p-1 rounded transition-colors ${
                      p.pinned ? 'text-cyan-400 bg-cyan-500/20' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHide(p.id)}
                    title={p.hidden ? 'Show panel' : 'Hide panel'}
                    className={`p-1 rounded transition-colors ${
                      p.hidden ? 'text-amber-400 bg-amber-500/20' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    {p.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMICALLY ORDERED PANELS */}
      <div className="space-y-6">
        {sortedPanels
          .filter((p) => !p.hidden)
          .map((panel, idx, arr) => {
            const isFirst = idx === 0;
            const isLast = idx === arr.length - 1;

            return (
              <div
                key={panel.id}
                className="rounded-2xl border border-white/[0.07] bg-[#0c0f18]/60 backdrop-blur-sm p-4 sm:p-5 space-y-4 relative transition-all"
              >
                {/* Header Controls for Reordering, Pinning, and Collapsing */}
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-200 tracking-wide">
                      {panel.title}
                    </span>
                    {panel.pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-neutral-400">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => movePanel(panel.id, 'up')}
                      title="Move panel up"
                      className="p-1 rounded hover:bg-neutral-800 disabled:opacity-20 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => movePanel(panel.id, 'down')}
                      title="Move panel down"
                      className="p-1 rounded hover:bg-neutral-800 disabled:opacity-20 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin(panel.id)}
                      title={panel.pinned ? 'Unpin' : 'Pin to top'}
                      className={`p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer ${
                        panel.pinned ? 'text-cyan-400' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(panel.id)}
                      title={panel.collapsed ? 'Expand panel' : 'Collapse panel'}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {panel.collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHide(panel.id)}
                      title="Hide panel from workspace"
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Panel Body (or Collapsed Placeholder) */}
                {panel.collapsed ? (
                  <div className="py-2 px-3 rounded-lg bg-neutral-900/40 text-xs font-mono text-neutral-500 flex items-center justify-between">
                    <span>Panel content minimized</span>
                    <button
                      type="button"
                      onClick={() => toggleCollapse(panel.id)}
                      className="text-cyan-400 hover:underline text-[11px]"
                    >
                      Expand
                    </button>
                  </div>
                ) : (
                  <div>
                    {panel.id === 'context-fusion' && (
                      <ContextFusionVisual
                        context={context}
                        hardware={hardware}
                        processingMode={processingMode}
                        onExecutePrompt={onExecutePrompt}
                        onNavigate={onNavigate}
                        stats={stats}
                      />
                    )}

                    {panel.id === 'current-context' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Current Context Stream</span>
                          </div>
                          <span className="font-mono text-[10px] text-neutral-400">
                            Telemetry Rate: 100ms interval
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Module A: Screen */}
                          <div
                            onClick={() => onNavigate('screen')}
                            className="p-3.5 rounded-xl border border-white/[0.07] bg-[#0d1017]/80 hover:bg-[#121622] hover:border-white/[0.15] transition-all cursor-pointer space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                  <Monitor className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-200">Screen</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            </div>
                            <div className="text-xs font-medium text-neutral-100 truncate">
                              {context?.application || 'VS Code'}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">
                              {context?.windowTitle || 'app.py (Line 42)'}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                              <span>Token Density</span>
                              <span className="text-cyan-400 font-semibold">
                                {context?.visualTokens?.length || 4} elements
                              </span>
                            </div>
                          </div>

                          {/* Module B: Memory */}
                          <div
                            onClick={() => onNavigate('memory')}
                            className="p-3.5 rounded-xl border border-white/[0.07] bg-[#0d1017]/80 hover:bg-[#121622] hover:border-white/[0.15] transition-all cursor-pointer space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  <Database className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-200">Memory</span>
                              </div>
                              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                                Local SQLite
                              </span>
                            </div>
                            <div className="text-xs font-medium text-neutral-100 truncate">
                              Snapdragon NPU Notes
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">
                              {stats?.memoryItemCount || 3} facts, 5 entity tags
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                              <span>Storage</span>
                              <span className="text-purple-300">SQLite On-Device</span>
                            </div>
                          </div>

                          {/* Module C: Documents */}
                          <div
                            onClick={() => onNavigate('documents')}
                            className="p-3.5 rounded-xl border border-white/[0.07] bg-[#0d1017]/80 hover:bg-[#121622] hover:border-white/[0.15] transition-all cursor-pointer space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-200">Documents</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                384-dim
                              </span>
                            </div>
                            <div className="text-xs font-medium text-neutral-100 truncate">
                              Hexagon NPU Whitepaper
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">
                              {stats?.documentCount || 2} indexed research files
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                              <span>Embedding Engine</span>
                              <span className="text-emerald-300">BGE-Small INT8</span>
                            </div>
                          </div>

                          {/* Module D: System & Acceleration */}
                          <div
                            onClick={() => onNavigate('performance')}
                            className="p-3.5 rounded-xl border border-white/[0.07] bg-[#0d1017]/80 hover:bg-[#121622] hover:border-white/[0.15] transition-all cursor-pointer space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                  <Cpu className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-semibold text-neutral-200">System</span>
                              </div>
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                                Verified
                              </span>
                            </div>
                            <div className="text-xs font-medium text-neutral-100 truncate">
                              {hardware?.isSnapdragon ? 'Snapdragon X Series' : 'Detected Host Runtime'}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate font-mono">
                              Policy: {processingMode.toUpperCase()}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                              <span>Target Latency</span>
                              <span className="text-emerald-400 font-semibold font-mono">Target: &lt;25ms</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {panel.id === 'hardware-runtime' && (
                      <HardwareRuntimePanel />
                    )}

                    {panel.id === 'instant-workflows' && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-1">
                          Instant Intelligence Workflows
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                              <button
                                key={action.title}
                                type="button"
                                onClick={action.action}
                                className="text-left p-4 rounded-xl border border-white/[0.06] bg-[#0d1017]/70 hover:bg-[#131724] hover:border-white/[0.14] transition-all group flex flex-col justify-between cursor-pointer"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg border ${action.color}`}>
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                                  </div>
                                  <div className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                                    {action.title}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                                    {action.desc}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
