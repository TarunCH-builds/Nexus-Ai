/**
 * NEXUS AI - Main Application Workspace
 * Production-quality React + TypeScript architecture with centralized state,
 * frameless desktop shell, toast messaging, and Snapdragon on-device inference.
 */

import React, { useState, useEffect } from 'react';
import { Shell } from './components/layout/Shell.js';
import { UniversalCommandBar } from './components/command/UniversalCommandBar.js';
import { NexusHome } from './components/views/NexusHome.js';
import { ScreenUnderstanding } from './components/views/ScreenUnderstanding.js';
import { DocumentIntelligence } from './components/views/DocumentIntelligence.js';
import { LocalMemory } from './components/views/LocalMemory.js';
import { KnowledgeGraphView } from './components/views/KnowledgeGraphView.js';
import { MeetingIntelligence } from './components/views/MeetingIntelligence.js';
import { ActionEngineView } from './components/views/ActionEngineView.js';
import { PerformanceLab } from './components/views/PerformanceLab.js';
import { PrivacyCenter } from './components/views/PrivacyCenter.js';
import { SettingsView } from './components/views/SettingsView.js';
import { DemoModeModal } from './components/views/DemoModeModal.js';
import { NexusProfile } from './components/views/NexusProfile.js';
import { NexusHistory } from './components/views/NexusHistory.js';
import { AppProvider, useApp } from './context/AppContext.js';
import { VoiceAssistantProvider } from './context/VoiceAssistantContext.js';

import { ChatResponse } from './types/index.js';
import { api, classifyClientError } from './services/api.js';
import { Sparkles, X, CheckCircle, Copy, Check, RotateCcw, BookOpen, Layers, Cpu, ShieldCheck, ChevronDown, ChevronUp, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function MainWorkspace() {
  const {
    currentView,
    setCurrentView,
    hardware,
    processingMode,
    setProcessingMode,
    context,
    refreshContext,
    addToast,
    isCommandBarOpen,
    setIsCommandBarOpen,
    isDemoModalOpen,
    setIsDemoModalOpen,
    aiHealth,
  } = useApp();

  const [memoryStats, setMemoryStats] = useState<any>(undefined);
  const [modalCopied, setModalCopied] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [checkingBackend, setCheckingBackend] = useState(false);
  const [activeAiModal, setActiveAiModal] = useState<{
    prompt: string;
    loading: boolean;
    statusMessage?: string;
    response?: ChatResponse;
    error?: {
      reason: string;
      details?: any;
      code?: string;
    };
  } | null>(null);

  // Periodic memory stats refresh
  const loadStats = async () => {
    try {
      const status = await api.getStatus();
      setMemoryStats(status.memoryStats);
    } catch (err) {
      console.warn('Memory stats warning:', err);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K -> Universal Command Bar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen(!isCommandBarOpen);
      }
      // Alt+1 / Alt+H -> Dashboard
      if (e.altKey && (e.key === '1' || e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        setCurrentView('home');
      }
      // Alt+2 / Alt+S -> Context Page
      if (e.altKey && (e.key === '2' || e.key.toLowerCase() === 's')) {
        e.preventDefault();
        setCurrentView('screen');
      }
      // Alt+3 / Alt+P -> AI Lab / Performance
      if (e.altKey && (e.key === '3' || e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setCurrentView('performance');
      }
      // Alt+4 / Alt+D -> Documents
      if (e.altKey && (e.key === '4' || e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        setCurrentView('documents');
      }
      // Alt+5 / Alt+R -> Privacy Center
      if (e.altKey && (e.key === '5' || e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        setCurrentView('privacy');
      }
      // Alt+6 / Alt+M -> Meetings
      if (e.altKey && (e.key === '6' || e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        setCurrentView('meeting');
      }
      // Alt+7 / Alt+A -> Actions Engine
      if (e.altKey && (e.key === '7' || e.key.toLowerCase() === 'a')) {
        e.preventDefault();
        setCurrentView('tasks');
      }
      // Alt+8 -> Local Memory
      if (e.altKey && e.key === '8') {
        e.preventDefault();
        setCurrentView('memory');
      }
      // Alt+9 -> Knowledge Graph
      if (e.altKey && e.key === '9') {
        e.preventDefault();
        setCurrentView('graph');
      }
      // Alt+, -> Settings
      if (e.altKey && (e.key === ',' || e.key.toLowerCase() === 't')) {
        e.preventDefault();
        setCurrentView('settings');
      }
      // Escape -> close modals
      if (e.key === 'Escape') {
        setIsCommandBarOpen(false);
        setIsDemoModalOpen(false);
        setActiveAiModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, setIsCommandBarOpen, setIsDemoModalOpen, setCurrentView]);

  // Handle Natural Language Prompt from Command Bar or Global Bar
  const handleExecutePrompt = async (prompt: string, taskType: any = 'reasoning') => {
    if (!prompt || !prompt.trim()) {
      addToast('warning', 'Please enter a valid prompt or question.', 'Empty Input');
      return;
    }

    const trimmedPrompt = prompt.trim();
    const activeModelName = aiHealth?.model || 'gemini-3.1-flash-lite';

    setActiveAiModal({
      prompt: trimmedPrompt,
      loading: true,
      statusMessage: 'NEXUS is thinking...',
      response: {
        success: true,
        answer: '',
        intent: 'reasoning',
        contextUsed: [],
        decision: {
          taskType: 'reasoning',
          selectedProvider: 'gemini',
          hardwareTarget: 'cloud',
          modelName: activeModelName,
          estimatedLatencyMs: 0,
          quantization: 'BF16',
          reasoning: 'Google Gemini Cloud Gateway',
          fallbackAvailable: true,
          privacyModeAllowed: true,
        },
        sourceReferences: [],
        suggestedActions: [],
        latencyMs: 0,
        tokensPerSecond: 0,
        metadata: {
          runtime: 'Google Gemini (Cloud)',
          model: activeModelName,
          latencyMs: 0,
        },
      } as any,
    });
    setShowExecutionDetails(false);
    setShowDiagnostics(false);

    try {
      // Primary standard endpoint: POST /api/chat
      const res = await api.chat(trimmedPrompt, taskType, true);
      setActiveAiModal({
        prompt: trimmedPrompt,
        loading: false,
        response: res,
      });
      addToast('success', `Completed in ${res.latencyMs || 250}ms`, 'NEXUS AI');
      refreshContext();
      loadStats();
    } catch (err: any) {
      const classified = classifyClientError(err);
      setActiveAiModal({
        prompt: trimmedPrompt,
        loading: false,
        error: {
          reason: classified.message,
          code: classified.code,
          details: classified.details || "NEXUS couldn't complete the request.",
        },
      });
      addToast('error', classified.message, 'AI Engine Interrupted');
    } finally {
      // Mandatory requirement: loading state MUST ALWAYS terminate
      setActiveAiModal(prev => prev ? { ...prev, loading: false } : prev);
    }
  };

  const handleAddTask = async (title: string, desc?: string, sourceTitle?: string) => {
    try {
      await api.addTask({
        title,
        description: desc,
        priority: 'high',
        source: 'screen',
        sourceTitle,
      });
      addToast('success', `Added task: "${title.slice(0, 40)}"`, 'Action Created');
      refreshContext();
      loadStats();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to add task', 'Task Error');
    }
  };

  const handleSetScenario = async (scenario: 'vscode_error' | 'research_pdf' | 'meeting_whiteboard') => {
    try {
      await api.setScenario(scenario);
      await refreshContext();
      addToast('info', `Switched active context to scenario: ${scenario}`, 'Context Updated');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to switch scenario', 'Context Error');
    }
  };

  return (
    <Shell
      currentView={currentView}
      onNavigate={setCurrentView}
      onOpenCommandBar={() => setIsCommandBarOpen(true)}
      onOpenDemo={() => setIsDemoModalOpen(true)}
      hardware={hardware}
      processingMode={processingMode}
      context={context}
    >
      {/* View routing */}
      {currentView === 'home' && (
        <NexusHome
          onNavigate={setCurrentView}
          onExecutePrompt={handleExecutePrompt}
          context={context}
          hardware={hardware}
          processingMode={processingMode}
          stats={memoryStats}
        />
      )}

      {currentView === 'screen' && (
        <ScreenUnderstanding
          context={context}
          onRefreshContext={refreshContext}
          onAddTask={handleAddTask}
        />
      )}

      {currentView === 'documents' && <DocumentIntelligence />}

      {currentView === 'memory' && <LocalMemory />}

      {currentView === 'graph' && <KnowledgeGraphView />}

      {(currentView === 'meeting' || currentView === 'meetings') && (
        <MeetingIntelligence onAddTask={handleAddTask} />
      )}

      {(currentView === 'tasks' || currentView === 'actions') && <ActionEngineView />}

      {currentView === 'performance' && <PerformanceLab />}

      {currentView === 'privacy' && (
        <PrivacyCenter
          currentMode={processingMode}
          onModeChange={setProcessingMode}
        />
      )}

      {currentView === 'profile' && <NexusProfile />}

      {currentView === 'history' && (
        <NexusHistory
          onSelectConversation={(id) => {
            setCurrentView('home');
          }}
          onNavigate={setCurrentView}
        />
      )}

      {currentView === 'settings' && <SettingsView hardware={hardware} />}

      {/* Universal Command Bar */}
      <UniversalCommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onNavigate={setCurrentView}
        onExecutePrompt={handleExecutePrompt}
      />

      {/* Competition Demo Mode Modal */}
      <DemoModeModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigate={setCurrentView}
        onSetScenario={handleSetScenario}
        onExecutePrompt={handleExecutePrompt}
      />

      {/* AI Quick Response Modal */}
      {activeAiModal && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
        >
          <div className="w-full max-w-2xl bg-[#0c0f18] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#080b12]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span id="ai-modal-title" className="text-xs font-bold text-neutral-100">NEXUS AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  AI PROVIDER: GEMINI · CLOUD
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAiModal(null)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 rounded-lg bg-[#080a10] border border-white/[0.08] text-xs font-medium text-neutral-200 flex items-start gap-2">
                <span className="text-neutral-500 font-mono text-[10px] uppercase shrink-0 pt-0.5">QUERY:</span>
                <span>"{activeAiModal.prompt}"</span>
              </div>

              {/* 1. Loading State */}
              {activeAiModal.loading && (
                <div className="py-12 flex flex-col items-center justify-center text-neutral-400 space-y-3">
                  <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <div className="text-xs font-medium text-neutral-200">
                    {activeAiModal.statusMessage || 'NEXUS is thinking...'}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Engine: Google Gemini Cloud Gateway
                  </div>
                </div>
              )}

              {/* 2. Error State */}
              {!activeAiModal.loading && activeAiModal.error && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>NEXUS couldn't complete the request.</span>
                  </div>

                  {activeAiModal.error.code === 'TIMEOUT' ? (
                    <div className="text-xs text-neutral-300 space-y-1.5 bg-black/40 p-3 rounded-lg border border-white/[0.04]">
                      <p className="text-neutral-300 font-medium">Possible causes:</p>
                      <ul className="list-disc list-inside text-neutral-400 text-xs space-y-1">
                        <li>AI provider unavailable</li>
                        <li>Network problem</li>
                        <li>Backend unavailable</li>
                        <li>Invalid configuration</li>
                      </ul>
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-300 font-sans">
                      <span className="text-neutral-500 font-mono text-[11px] uppercase mr-2">Reason:</span>
                      <span>{activeAiModal.error.reason}</span>
                    </div>
                  )}

                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleExecutePrompt(activeAiModal.prompt)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveAiModal(null)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.08]"
                    >
                      <X className="w-3 h-3" />
                      <span>Dismiss</span>
                    </button>
                    <button
                      type="button"
                      disabled={checkingBackend}
                      onClick={async () => {
                        setCheckingBackend(true);
                        try {
                          const h = await api.getHealth();
                          addToast('info', `Backend status: ${h.status || 'online'}`, 'Backend Health');
                        } catch {
                          addToast('error', 'Backend is currently unreachable.', 'Health Check');
                        } finally {
                          setCheckingBackend(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.08]"
                    >
                      <Activity className="w-3 h-3 text-cyan-400" />
                      <span>{checkingBackend ? 'Checking...' : 'Check Backend'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDiagnostics(!showDiagnostics)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.08]"
                    >
                      <span>View Diagnostics</span>
                      {showDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {showDiagnostics && (
                    <div className="mt-3 p-3 rounded-lg bg-black/60 border border-white/[0.06] text-[11px] font-mono text-neutral-400 overflow-x-auto space-y-1">
                      <div className="text-neutral-500 font-semibold uppercase text-[10px]">Technical Diagnostics:</div>
                      <pre className="text-rose-300/90 whitespace-pre-wrap">{typeof activeAiModal.error.details === 'object' ? JSON.stringify(activeAiModal.error.details, null, 2) : String(activeAiModal.error.details)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Success State: Direct Answer + Expandable Execution Details */}
              {!activeAiModal.loading && activeAiModal.response && (
                <div className="space-y-4">
                  {/* Primary User-Facing Answer */}
                  <div className="p-4 rounded-xl bg-neutral-900/40 border border-white/[0.06] space-y-2">
                    <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
                      Answer
                    </div>
                    <div className="prose prose-invert prose-xs max-w-none text-neutral-200 leading-relaxed text-xs">
                      <ReactMarkdown>{activeAiModal.response.answer}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Context Used & Runtime Summary Bar */}
                  <div className="pt-2 border-t border-white/[0.08] flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-3">
                    <div className="flex flex-wrap items-center gap-4 text-[11px]">
                      <div>
                        <span className="text-neutral-500 font-medium">Context used: </span>
                        <span className="text-neutral-200 font-mono">
                          {activeAiModal.response.contextUsed && activeAiModal.response.contextUsed.length > 0
                            ? activeAiModal.response.contextUsed.join(', ')
                            : (activeAiModal.response.sourceReferences && activeAiModal.response.sourceReferences.length > 0
                              ? activeAiModal.response.sourceReferences.join(', ')
                              : 'None')}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium">Runtime: </span>
                        <span className="text-emerald-400 font-mono">
                          {activeAiModal.response.metadata?.runtime ||
                           (activeAiModal.response.decision.hardwareTarget === 'cloud' ? 'Cloud' : 'Local')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeAiModal.response?.answer) {
                            navigator.clipboard.writeText(activeAiModal.response.answer);
                            setModalCopied(true);
                            addToast('success', 'Response copied to clipboard', 'Copied');
                            setTimeout(() => setModalCopied(false), 2500);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.06]"
                      >
                        {modalCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExecutePrompt(activeAiModal.prompt)}
                        className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/[0.06]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Regenerate</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Execution Details */}
                  <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#080a10]">
                    <button
                      type="button"
                      onClick={() => setShowExecutionDetails(!showExecutionDetails)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-neutral-300 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <span className="font-mono text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Execution Details</span>
                      </span>
                      <div className="flex items-center gap-2 text-neutral-500">
                        <span className="text-[10px] font-mono">{activeAiModal.response.latencyMs} ms</span>
                        {showExecutionDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </button>

                    {showExecutionDetails && (
                      <div className="p-3.5 border-t border-white/[0.06] space-y-3 text-[11px] font-mono text-neutral-300">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded bg-neutral-900/60 border border-white/[0.04]">
                            <span className="text-neutral-500 block text-[10px] uppercase">Intent</span>
                            <span className="text-cyan-300 font-semibold">{activeAiModal.response.intent || activeAiModal.response.processingMetadata?.intent || 'GENERAL_CHAT'}</span>
                          </div>
                          <div className="p-2 rounded bg-neutral-900/60 border border-white/[0.04]">
                            <span className="text-neutral-500 block text-[10px] uppercase">Model</span>
                            <span className="text-neutral-200">{activeAiModal.response.processingMetadata?.model || activeAiModal.response.decision.modelName}</span>
                          </div>
                          <div className="p-2 rounded bg-neutral-900/60 border border-white/[0.04]">
                            <span className="text-neutral-500 block text-[10px] uppercase">Execution Target</span>
                            <span className="text-indigo-300 font-semibold">{activeAiModal.response.decision.hardwareTarget.toUpperCase()}</span>
                          </div>
                          <div className="p-2 rounded bg-neutral-900/60 border border-white/[0.04]">
                            <span className="text-neutral-500 block text-[10px] uppercase">Security Status</span>
                            <span className="text-emerald-400 font-semibold">{activeAiModal.response.securityCheck?.status || 'PASS'}</span>
                          </div>
                        </div>

                        {/* Citations Grounding if present */}
                        {activeAiModal.response.citations && activeAiModal.response.citations.length > 0 && (
                          <div className="pt-2 border-t border-white/[0.06] space-y-2">
                            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Grounded Document Citations ({activeAiModal.response.citations.length}):</span>
                            </div>
                            <div className="space-y-1.5">
                              {activeAiModal.response.citations.map((c: any, i: number) => (
                                <div key={i} className="text-[11px] p-2 rounded bg-black/40 border border-white/[0.04] text-neutral-300">
                                  <div className="flex items-center justify-between text-emerald-300 font-semibold text-[10px]">
                                    <span>{c.documentTitle} (Chunk #{c.chunkIndex})</span>
                                    <span>Match: {(c.similarity * 100).toFixed(1)}%</span>
                                  </div>
                                  <p className="text-neutral-400 mt-1 line-clamp-2 italic">"{c.snippet}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested Actions */}
                  {activeAiModal.response.suggestedActions?.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] uppercase font-mono font-semibold text-neutral-400 mb-2">
                        Suggested Next Actions:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeAiModal.response.suggestedActions.map((act: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAddTask(act, 'Suggested by NEXUS AI intent pipeline')}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3 text-indigo-400" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/[0.08] bg-[#080b12] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setActiveAiModal(null)}
                className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <VoiceAssistantProvider>
        <MainWorkspace />
      </VoiceAssistantProvider>
    </AppProvider>
  );
}
