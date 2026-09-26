/**
 * NEXUS AI - Premium Universal Command Interface
 * 
 * Accessible via Ctrl+K / Cmd+K or clicking the search trigger.
 * States:
 * IDLE -> LISTENING -> ANALYZING -> RETRIEVING -> PROCESSING -> COMPLETE / ERROR
 * 
 * Supports:
 * - Natural language queries
 * - Context-aware questions
 * - Document questions & RAG retrieval
 * - Memory queries
 * - Meeting summaries
 * - Debugging & remediation requests
 * - Action requests
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  History,
  Monitor,
  FileText,
  Database,
  Users,
  Cpu,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  X,
  ArrowRight,
  Mic,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  RotateCcw,
} from 'lucide-react';
import { CommandExecutionState, DocumentCitation } from '../../types/index.js';
import { api, classifyClientError, ClassifiedApiError } from '../../services/api.js';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext.js';
import { Volume2, VolumeX, Radio, MicOff, Sliders } from 'lucide-react';
import { NexusLogo } from '../brand/NexusLogo.js';

interface UniversalCommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onExecutePrompt: (prompt: string, taskType?: string) => void;
}

export const UniversalCommandBar: React.FC<UniversalCommandBarProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onExecutePrompt,
}) => {
  const {
    state: voiceState,
    statusText: voiceStatusText,
    interimTranscript: voiceInterimTranscript,
    finalTranscript: voiceFinalTranscript,
    audioLevels: voiceAudioLevels,
    startListening: startVoiceSession,
    stopListening: stopVoiceSession,
    toggleHandsFree,
    toggleMute,
    setIsSettingsModalOpen,
  } = useVoiceAssistant();

  const [query, setQuery] = useState('');
  const [state, setState] = useState<CommandExecutionState>('IDLE');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [audioLevels, setAudioLevels] = useState<number[]>([6, 12, 18, 24, 14, 8, 22, 28, 16, 10, 20, 26, 14, 8, 6, 10]);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [lastExecutedPrompt, setLastExecutedPrompt] = useState<string>('');
  const [showInlineDetails, setShowInlineDetails] = useState<boolean>(false);
  const [classifiedError, setClassifiedError] = useState<ClassifiedApiError | null>(null);
  const [inlineResult, setInlineResult] = useState<{
    answer: string;
    citations?: DocumentCitation[];
    latencyMs?: number;
    tokensPerSecond?: number;
    hardware?: string;
    intent?: string;
    model?: string;
    contextUsed?: string[];
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const stopListening = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    setInterimTranscript('');
    setState('IDLE');
    setStatusMessage('');
  };

  const startListening = async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setState('ERROR');
      setStatusMessage('Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    try {
      setState('LISTENING');
      setStatusMessage('Listening to microphone stream (Real-time Web Speech API + Web Audio Waveform)...');
      setInterimTranscript('');

      // 1. Microphone capture for real-time waveform visualization
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.75;
            source.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const renderWaveform = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);

              const bars: number[] = [];
              for (let i = 0; i < 16; i++) {
                const val = dataArray[i * 2] || 0;
                // Map frequency intensity to 4px - 32px height
                const barHeight = Math.max(4, Math.round((val / 255) * 32));
                bars.push(barHeight);
              }
              setAudioLevels(bars);
              animFrameRef.current = requestAnimationFrame(renderWaveform);
            };
            renderWaveform();
          }
        } catch (audioErr) {
          console.warn('Microphone stream for audio visualizer restricted, running harmonic wave fallback:', audioErr);
          let phase = 0;
          const animateFallback = () => {
            phase += 0.18;
            const bars = Array.from({ length: 16 }, (_, i) => {
              const val = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
              return Math.max(4, Math.round(val * 24 + 4));
            });
            setAudioLevels(bars);
            animFrameRef.current = requestAnimationFrame(animateFallback);
          };
          animateFallback();
        }
      }

      // 2. Web Speech Recognition setup
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onresult = (event: any) => {
        let currentInterim = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        setInterimTranscript(currentInterim);

        if (finalChunk) {
          setQuery((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalChunk.trim()}` : finalChunk.trim();
          });
          setInterimTranscript('');
        }
      };

      recognizer.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone access denied. Grant microphone permission in your browser to use voice input.');
          stopListening();
          setState('ERROR');
        }
      };

      recognizer.onend = () => {
        if (recognitionRef.current) {
          // If stopped by user, recognitionRef was cleared
          stopListening();
        }
      };

      recognitionRef.current = recognizer;
      recognizer.start();
    } catch (err: any) {
      console.error('Speech initialization error:', err);
      setState('ERROR');
      setStatusMessage(err?.message || 'Failed to start speech recognition.');
      stopListening();
    }
  };

  const handleVoiceListen = () => {
    if (state === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (voiceState === 'LISTENING') {
        setState('LISTENING');
        setStatusMessage('Voice listening active (Wake word "Hey NEXUS" detected)...');
      } else {
        setState('IDLE');
        setStatusMessage('');
      }
      setInlineResult(null);
    } else {
      stopListening();
      setQuery('');
      setState('IDLE');
      setInlineResult(null);
    }
  }, [isOpen, voiceState]);

  // Sync voice assistant transcript into search query when voice is active
  useEffect(() => {
    if (isOpen && voiceState === 'LISTENING') {
      if (voiceInterimTranscript) {
        setInterimTranscript(voiceInterimTranscript);
        setQuery(voiceInterimTranscript);
      }
      if (voiceFinalTranscript && !inlineResult && !['PROCESSING', 'STREAMING'].includes(state)) {
        setQuery(voiceFinalTranscript);
      }
    }
  }, [isOpen, voiceState, voiceInterimTranscript, voiceFinalTranscript, state, inlineResult]);

  if (!isOpen) return null;

  const quickCommands = [
    { cmd: '/history', label: 'AI History Timeline', desc: 'Browse Today, Yesterday, and saved AI conversations', icon: History, view: 'history', category: 'Account' },
    { cmd: '/profile', label: 'User Profile & Retention', desc: 'Manage your personal workspace, data export, & security', icon: ShieldCheck, view: 'profile', category: 'Account' },
    { cmd: '/screen', label: 'Understand Screen Context', desc: 'Perceive active window & diagnose visible bugs', icon: Monitor, view: 'screen', category: 'Perception' },
    { cmd: '/document', label: 'Query Document Intelligence', desc: 'Semantic RAG retrieval with verified citations', icon: FileText, view: 'documents', category: 'Knowledge' },
    { cmd: '/memory', label: 'Search Local Memory', desc: 'Dense vector search across on-device SQLite database', icon: Database, view: 'memory', category: 'Knowledge' },
    { cmd: '/meeting', label: 'Meeting Intelligence', desc: 'Transcribe audio buffer, track decisions & action items', icon: Users, view: 'meeting', category: 'Perception' },
    { cmd: '/actions', label: 'Security Action Engine', desc: 'Review, sandbox, and approve AI proposed actions', icon: CheckSquare, view: 'tasks', category: 'Security' },
    { cmd: '/performance', label: 'Hardware Runtime & Diagnostics', desc: 'Real measured benchmarks & Snapdragon NPU target status', icon: Cpu, view: 'performance', category: 'System' },
    { cmd: '/privacy', label: 'Privacy & Data Flow Center', desc: 'Audit zero cloud egress and toggle hardware permissions', icon: ShieldCheck, view: 'privacy', category: 'Security' },
    { cmd: '/voice-start', label: 'Start Voice Session', desc: 'Activate voice assistant and begin speech capture', icon: Mic, action: 'voice_start', category: 'Voice' },
    { cmd: '/voice-wake-on', label: 'Enable Hands-Free Wake Word', desc: 'Listen locally for "Hey NEXUS" or "Hi NEXUS"', icon: Radio, action: 'voice_wake_on', category: 'Voice' },
    { cmd: '/voice-wake-off', label: 'Disable Hands-Free Mode', desc: 'Turn off background wake-word detection', icon: MicOff, action: 'voice_wake_off', category: 'Voice' },
    { cmd: '/voice-mute', label: 'Mute / Unmute NEXUS Voice', desc: 'Toggle spoken audio output during responses', icon: Volume2, action: 'voice_mute', category: 'Voice' },
    { cmd: '/voice-settings', label: 'Voice Assistant Settings', desc: 'Configure wake word, TTS speech rate, volume, and voices', icon: Sliders, action: 'voice_settings', category: 'Voice' },
  ];

  const suggestedPrompts = [
    { text: 'Analyze screen + 2 documents for Snapdragon NPU requirements', category: 'Multimodal' },
    { text: 'How does INT8 quantization reduce memory bandwidth in QNN?', category: 'RAG' },
    { text: 'Show recent action items and decisions from team meeting', category: 'Meeting' },
    { text: 'Diagnose CORS error and propose sandboxed remediation script', category: 'Debugging' },
  ];

  const filteredCommands = quickCommands.filter(c => 
    c.cmd.toLowerCase().includes(query.toLowerCase()) || 
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.desc.toLowerCase().includes(query.toLowerCase())
  );

  const handleExecute = async (promptToRun: string) => {
    if (!promptToRun || !promptToRun.trim()) return;
    const cleanPrompt = promptToRun.trim();
    setLastExecutedPrompt(cleanPrompt);
    setShowInlineDetails(false);
    setClassifiedError(null);

    // Direct routing check
    if (cleanPrompt.startsWith('/')) {
      const match = quickCommands.find(c => cleanPrompt.startsWith(c.cmd));
      if (match) {
        if ((match as any).action) {
          const act = (match as any).action;
          if (act === 'voice_start') startVoiceSession(true);
          else if (act === 'voice_wake_on') toggleHandsFree(true);
          else if (act === 'voice_wake_off') toggleHandsFree(false);
          else if (act === 'voice_mute') toggleMute();
          else if (act === 'voice_settings') setIsSettingsModalOpen(true);
          onClose();
          return;
        }
        if ((match as any).view) {
          onNavigate((match as any).view);
          onClose();
          return;
        }
      }
    }

    // State sequence: CONNECTING -> PROCESSING -> STREAMING -> SUCCESS
    setState('CONNECTING');
    setStatusMessage('Connecting to AI engine...');
    setInlineResult({
      answer: '',
      latencyMs: 0,
      model: 'gemini-3.1-flash-lite',
      hardware: 'Google Gemini (Cloud)',
      intent: 'AI_REASONING',
      contextUsed: [],
    });

    let streamCompleted = false;

    try {
      setState('PROCESSING');
      setStatusMessage('NEXUS is thinking...');
      await api.chatStream(cleanPrompt, {
        onStatus: (status) => {
          setStatusMessage(status);
          if (status.toLowerCase().includes('context')) {
            setState('RETRIEVING');
          } else if (status.toLowerCase().includes('generating')) {
            setState('STREAMING');
          }
        },
        onChunk: (chunk) => {
          setState('STREAMING');
          setStatusMessage('NEXUS is generating response...');
          setInlineResult((prev) => ({
            ...prev!,
            answer: (prev?.answer || '') + chunk,
          }));
        },
        onDone: (doneData) => {
          streamCompleted = true;
          setState('SUCCESS');
          setStatusMessage('Response ready.');
          setInlineResult((prev) => ({
            answer: doneData.answer || prev?.answer || 'Response synthesized.',
            citations: doneData.citations || [],
            latencyMs: doneData.latencyMs,
            tokensPerSecond: doneData.tokensPerSecond,
            hardware: 'Google Gemini (Cloud)',
            intent: doneData.intent || 'REASONING',
            model: doneData.model || 'gemini-3.1-flash-lite',
            contextUsed: doneData.context_used || doneData.contextUsed || [],
          }));
        },
        onError: (err) => {
          throw err;
        },
      });
    } catch (err: any) {
      if (!streamCompleted) {
        // Fallback to standard HTTP chat endpoint if SSE stream fails
        try {
          setState('PROCESSING');
          setStatusMessage('Connecting via gateway fallback...');
          const data = await api.chat(cleanPrompt, 'reasoning', true);
          streamCompleted = true;
          setState('SUCCESS');
          setStatusMessage('Response ready.');
          setInlineResult({
            answer: data.answer || 'Response synthesized.',
            citations: data.citations || [],
            latencyMs: data.latencyMs,
            tokensPerSecond: data.tokensPerSecond,
            hardware: 'Google Gemini (Cloud)',
            intent: data.intent,
            model: (data as any).model || data.metadata?.model || 'gemini-3.1-flash-lite',
            contextUsed: (data as any).context_used || data.contextUsed || [],
          });
        } catch (fallbackErr: any) {
          const classified = classifyClientError(fallbackErr);
          setClassifiedError(classified);
          if (classified.code === 'TIMEOUT') {
            setState('TIMEOUT');
            setStatusMessage('Request timed out: Unable to reach the AI engine.');
          } else if (classified.code === 'BACKEND_OFFLINE') {
            setState('OFFLINE');
            setStatusMessage('BACKEND OFFLINE: Unable to reach the local NEXUS backend server.');
          } else {
            setState('ERROR');
            setStatusMessage(classified.message || 'AI engine interrupted.');
          }
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (['CONNECTING', 'ANALYZING', 'RETRIEVING', 'PROCESSING'].includes(state)) {
      return;
    }
    if (state === 'LISTENING') {
      stopListening();
    }
    const target = query.trim() || interimTranscript.trim();
    if (target) {
      handleExecute(target);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0f121d] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden text-neutral-200 flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* State Banner */}
        {state !== 'IDLE' && (
          <div className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b ${
            ['COMPLETE', 'SUCCESS'].includes(state)
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
              : ['ERROR', 'TIMEOUT', 'OFFLINE'].includes(state)
              ? 'bg-rose-950/50 border-rose-500/30 text-rose-300'
              : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-300'
          }`}>
            <div className="flex items-center gap-2">
              {['CONNECTING', 'ANALYZING', 'RETRIEVING', 'PROCESSING', 'STREAMING'].includes(state) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              )}
              {state === 'LISTENING' && (
                <Mic className="w-3.5 h-3.5 animate-pulse text-amber-400" />
              )}
              {['COMPLETE', 'SUCCESS'].includes(state) && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {['ERROR', 'TIMEOUT', 'OFFLINE'].includes(state) && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="font-semibold tracking-wider">[{state}]</span>
              <span>{statusMessage}</span>
            </div>
            <span className="text-[10px] text-neutral-400">AI Provider: Gemini · Processing: Cloud</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center px-4 py-3.5 border-b border-white/[0.08] gap-3 bg-[#131726]/60">
          <NexusLogo variant="symbol" size="xs" />
          <input
            ref={inputRef}
            type="text"
            id="nexus-command-input"
            name="nexus-command-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                if (['ANALYZING', 'RETRIEVING', 'PROCESSING'].includes(state)) {
                  setState('IDLE');
                  setStatusMessage('');
                } else {
                  onClose();
                }
              }
            }}
            placeholder={
              state === 'LISTENING'
                ? 'Listening to your voice... Speak now...'
                : "Ask NEXUS anything (e.g. 'Explain recursion', 'What is polymorphism in Java?')..."
            }
            className="w-full bg-transparent text-sm focus:outline-none placeholder-neutral-500 text-neutral-100"
          />

          <button
            type="button"
            onClick={handleVoiceListen}
            title={state === 'LISTENING' ? 'Stop listening' : 'Start speech-to-text (Web Speech API)'}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              state === 'LISTENING' 
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 ring-2 ring-amber-500/30 animate-pulse'
                : 'border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>

          <button 
            type="button" 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Real-Time Speech Waveform Animation Banner during LISTENING */}
        {state === 'LISTENING' && (
          <div className="px-4 py-3 bg-gradient-to-r from-cyan-950/40 via-amber-950/30 to-cyan-950/40 border-b border-cyan-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping absolute opacity-75" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 relative z-10" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 font-mono">
                  <span>ACTIVE LISTENING</span>
                  <span className="text-[10px] text-neutral-400 font-sans">· Web Speech API</span>
                </div>
                <div className="text-xs text-cyan-300 italic truncate max-w-xs sm:max-w-sm mt-0.5">
                  {interimTranscript ? `"${interimTranscript}..."` : 'Waiting for voice signal...'}
                </div>
              </div>
            </div>

            {/* Visual Dynamic Waveform Animation */}
            <div className="flex items-center gap-1 bg-black/60 px-3 py-2 rounded-xl border border-white/[0.1] shadow-inner">
              {(voiceState === 'LISTENING' && voiceAudioLevels.length > 0 ? voiceAudioLevels : audioLevels).map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full transition-all duration-75 bg-gradient-to-t from-cyan-500 via-teal-400 to-amber-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  stopListening();
                  const target = (query + ' ' + interimTranscript).trim();
                  if (target) {
                    setQuery(target);
                    handleExecute(target);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Run</span>
              </button>
              <button
                type="button"
                onClick={stopListening}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/[0.08] text-neutral-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Active Inline AI Response Result */}
          {inlineResult && (
            <div className="p-4 rounded-xl bg-neutral-900/90 border border-indigo-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>Answer</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                  {inlineResult.latencyMs && <span>{inlineResult.latencyMs}ms</span>}
                  {inlineResult.tokensPerSecond && <span>· {inlineResult.tokensPerSecond} tok/s</span>}
                  <span className="px-1.5 py-0.5 rounded bg-neutral-950 border border-white/[0.05] text-cyan-300">
                    {inlineResult.hardware || 'Local CPU SIMD'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-neutral-200 leading-relaxed font-sans whitespace-pre-line p-2.5 rounded-lg bg-neutral-950/60 border border-white/[0.04]">
                {inlineResult.answer}
              </div>

              {/* Context & Runtime summary bar */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/[0.06] gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-neutral-500">Context used: </span>
                    <span className="text-neutral-300 font-mono">
                      {inlineResult.contextUsed && inlineResult.contextUsed.length > 0
                        ? inlineResult.contextUsed.join(', ')
                        : 'None (General Knowledge)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500">AI Provider: </span>
                    <span className="text-cyan-400 font-mono">Gemini</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Processing: </span>
                    <span className="text-emerald-400 font-mono">Cloud</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowInlineDetails(!showInlineDetails)}
                  className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showInlineDetails ? 'Hide Details' : 'Execution Details'}</span>
                  {showInlineDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Expandable Execution Details */}
              {showInlineDetails && (
                <div className="p-3 rounded-lg bg-black/60 border border-white/[0.06] space-y-2 text-[11px] font-mono">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-neutral-500 block uppercase">Intent</span>
                      <span className="text-cyan-300">{inlineResult.intent || 'GENERAL_CHAT'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block uppercase">Model</span>
                      <span className="text-neutral-200">{inlineResult.model || 'gemini-3.8-flash'}</span>
                    </div>
                  </div>

                  {/* Verified Document Citations */}
                  {inlineResult.citations && inlineResult.citations.length > 0 && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                      <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-cyan-400" />
                        <span>Verified Citations ({inlineResult.citations.length})</span>
                      </div>
                      <div className="space-y-1">
                        {inlineResult.citations.map((c, idx) => (
                          <div
                            key={c.chunkId || idx}
                            className="p-2 rounded bg-neutral-950/80 border border-white/[0.05] text-[11px] space-y-1"
                          >
                            <div className="flex items-center justify-between text-neutral-300">
                              <span className="font-semibold text-cyan-300">
                                [{idx + 1}] {c.documentTitle} (Chunk #{c.chunkIndex})
                              </span>
                              <span className="font-mono text-[10px] text-neutral-500">
                                Similarity: {(c.similarity * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-neutral-400 line-clamp-2 italic">
                              "{c.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inlineResult.answer);
                    setStatusMessage('Copied to clipboard!');
                    setTimeout(() => setStatusMessage(''), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors cursor-pointer border border-white/[0.08]"
                >
                  <span>Copy</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExecutePrompt(lastExecutedPrompt || query || inlineResult.answer);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Full Workspace View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {['ERROR', 'TIMEOUT', 'OFFLINE'].includes(state) && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {state === 'TIMEOUT'
                    ? 'Unable to reach the AI engine.'
                    : state === 'OFFLINE'
                    ? 'BACKEND OFFLINE'
                    : 'AI CONNECTION INTERRUPTED'}
                </span>
              </div>

              {state === 'TIMEOUT' ? (
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
                <p className="text-xs text-rose-200/90">{statusMessage || 'Gemini inference failed.'}</p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecute(lastExecutedPrompt || query)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setState('IDLE');
                    setStatusMessage('');
                    setClassifiedError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Quick query trigger card */}
          {query.trim().length > 0 && !query.startsWith('/') && state === 'IDLE' && (
            <div 
              onClick={() => handleExecute(query)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-950/40 cursor-pointer border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="text-xs font-semibold text-indigo-200">Execute Context Query</div>
                  <div className="text-xs text-indigo-300 font-mono">"{query}"</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-neutral-950/60 px-2 py-1 rounded border border-indigo-500/20">
                <span>Enter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}

          {/* Suggested Multimodal Prompts */}
          {query.trim().length === 0 && !inlineResult && (
            <div className="space-y-1.5">
              <div className="px-1 text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                <span>Suggested Multimodal Workflows</span>
                <span className="text-[10px] text-neutral-500">Click to run</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(p.text);
                      handleExecute(p.text);
                    }}
                    className="p-2.5 rounded-lg bg-[#141828]/80 hover:bg-[#1a2035] border border-white/[0.06] hover:border-indigo-500/30 text-left transition-all group"
                  >
                    <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider mb-1">
                      {p.category}
                    </div>
                    <div className="text-xs text-neutral-300 group-hover:text-white line-clamp-2 leading-relaxed">
                      {p.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filtered Workspace Commands */}
          <div className="space-y-1 pt-1">
            <div className="px-1 py-1 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
              {query.startsWith('/') ? 'Matching Commands' : 'Workspace Navigation & Tools'}
            </div>

            <div className="space-y-1">
              {filteredCommands.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.cmd}
                    type="button"
                    onClick={() => {
                      if ((item as any).action) {
                        const act = (item as any).action;
                        if (act === 'voice_start') startVoiceSession(true);
                        else if (act === 'voice_wake_on') toggleHandsFree(true);
                        else if (act === 'voice_wake_off') toggleHandsFree(false);
                        else if (act === 'voice_mute') toggleMute();
                        else if (act === 'voice_settings') setIsSettingsModalOpen(true);
                        onClose();
                        return;
                      }
                      if (item.view) {
                        onNavigate(item.view);
                        onClose();
                      }
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800/80 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-neutral-800/90 group-hover:bg-neutral-700 text-neutral-300 border border-white/[0.04]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                          {item.label}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-950 text-cyan-400 font-mono border border-cyan-500/20">
                            {item.cmd}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400">{item.desc}</div>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500 group-hover:text-neutral-300 font-mono flex items-center gap-1">
                      <span>Jump</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-neutral-950/80 border-t border-white/[0.06] text-xs text-neutral-400 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">Enter</kbd> Execute</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">ESC</kbd> Close</span>
          </div>
          <span className="text-emerald-400/90 font-mono text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Local-First Mode Active
          </span>
        </div>
      </div>
    </div>
  );
};
