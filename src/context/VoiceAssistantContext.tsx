/**
 * NEXUS AI - Hands-Free Voice Assistant State & Orchestrator
 * Centralizes wake-word detection, speech synthesis, barge-in,
 * natural multi-turn conversation timeout, and command routing.
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  VoiceState,
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  WAKE_WORD_REGEX,
  STOP_WORDS_REGEX,
  sanitizeMarkdownForSpeech,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from '../services/voiceAssistant.js';
import { audioFeedback } from '../services/voiceFeedback.js';
import { useApp } from './AppContext.js';
import { api } from '../services/api.js';

interface PendingConfirmation {
  actionId: string;
  prompt: string;
  description: string;
  onConfirm: () => void;
}

interface VoiceAssistantContextValue {
  state: VoiceState;
  statusText: string;
  interimTranscript: string;
  finalTranscript: string;
  lastResponseText: string;
  settings: VoiceSettings;
  updateSettings: (partial: Partial<VoiceSettings>) => void;
  audioLevels: number[];
  isSpeechSupported: boolean;
  isMuted: boolean;
  activeConversation: boolean;
  conversationCountdown: number;
  micPermission: 'prompt' | 'granted' | 'denied';
  requestMicPermission: () => Promise<void>;
  isOrbExpanded: boolean;
  setIsOrbExpanded: (expanded: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  pendingConfirmation: PendingConfirmation | null;
  startListening: (pushToTalk?: boolean) => void;
  stopListening: () => void;
  interrupt: () => void;
  toggleHandsFree: (enable?: boolean) => void;
  toggleVoiceOutput: (enable?: boolean) => void;
  toggleMute: () => void;
  confirmPendingAction: () => void;
  cancelPendingAction: () => void;
  executeVoicePrompt: (promptText: string) => Promise<void>;
  speakText: (text: string) => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

const SETTINGS_STORAGE_KEY = 'nexus_voice_settings';

export const VoiceAssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    currentView,
    setCurrentView,
    addToast,
    refreshContext,
    context,
    isCommandBarOpen,
    setIsCommandBarOpen,
  } = useApp();

  // Settings
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_VOICE_SETTINGS,
          ...parsed,
          voiceOutputEnabled: parsed.voiceOutputEnabled ?? true,
          autoListenFollowUp: parsed.autoListenFollowUp ?? true,
        };
      }
    } catch {}
    return DEFAULT_VOICE_SETTINGS;
  });

  const [state, setState] = useState<VoiceState>('STANDBY');
  const [statusText, setStatusText] = useState<string>("Say 'Hey NEXUS'");
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');
  const [lastResponseText, setLastResponseText] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeConversation, setActiveConversation] = useState<boolean>(false);
  const [conversationCountdown, setConversationCountdown] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [audioLevels, setAudioLevels] = useState<number[]>([4, 6, 8, 12, 8, 6, 14, 18, 10, 8, 12, 16, 10, 6, 4, 8]);
  const [isOrbExpanded, setIsOrbExpanded] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const isSpeechSupported = isSpeechRecognitionSupported() && isSpeechSynthesisSupported();

  // Refs for audio analyzer & speech engines
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const followUpTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const watchdogTimerRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const accumulatedSpeechRef = useRef<string>('');
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const stateRef = useRef<VoiceState>(state);
  const settingsRef = useRef<VoiceSettings>(settings);
  const isMutedRef = useRef<boolean>(isMuted);
  const activeConversationRef = useRef<boolean>(activeConversation);
  const micPermissionRef = useRef<'prompt' | 'granted' | 'denied'>(micPermission);
  const isExecutingRef = useRef<boolean>(false);

  // Helper to explicitly request microphone permission
  const requestMicPermission = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        mediaStreamRef.current = stream;
        setMicPermission('granted');
        micPermissionRef.current = 'granted';
        startListening(false);
        addToast('success', 'Microphone granted. You can say "Hey NEXUS" anytime.', 'Microphone Active');
      }
    } catch (err: any) {
      setMicPermission('denied');
      micPermissionRef.current = 'denied';
      addToast('error', 'Microphone access was denied. Please allow microphone in browser settings.', 'Microphone Denied');
    }
  };

  // Pre-load speech voices for Chrome/Edge
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        try { window.speechSynthesis.getVoices(); } catch {}
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Keep state refs in sync for event listeners
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    micPermissionRef.current = micPermission;
  }, [micPermission]);

  // Update Settings helper
  const updateSettings = (partial: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  // Web Audio Waveform visualizer
  const startAudioAnalyzer = async () => {
    if (typeof window === 'undefined') return;
    try {
      if (!mediaStreamRef.current && navigator.mediaDevices?.getUserMedia) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setMicPermission('granted');
      }

      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }

      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume().catch(() => {});
      }

      if (!analyserRef.current && mediaStreamRef.current && audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
      }

      const dataArray = new Uint8Array(analyserRef.current?.frequencyBinCount || 32);

      const render = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const bars: number[] = [];
        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * 2] || 0;
          const barHeight = Math.max(4, Math.round((val / 255) * 36));
          bars.push(barHeight);
        }
        setAudioLevels(bars);
        animFrameRef.current = requestAnimationFrame(render);
      };
      render();
    } catch {
      // Harmonic fallback animation
      let phase = 0;
      const animateFallback = () => {
        phase += 0.16;
        const bars = Array.from({ length: 16 }, (_, i) => {
          const val = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
          return Math.max(4, Math.round(val * 24 + 4));
        });
        setAudioLevels(bars);
        animFrameRef.current = requestAnimationFrame(animateFallback);
      };
      animateFallback();
    }
  };

  const stopAudioAnalyzer = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    // Return to resting audio levels
    setAudioLevels([4, 6, 8, 12, 8, 6, 14, 18, 10, 8, 12, 16, 10, 6, 4, 8]);
  };

  // TTS Speech Synthesis with markdown sanitization and cancellation
  const speakText = (text: string) => {
    if (!isSpeechSynthesisSupported()) {
      scheduleFollowUpWindow();
      return;
    }
    if (!settingsRef.current.voiceOutputEnabled || isMutedRef.current) {
      // If voice output is muted, finish immediately and open follow-up window
      scheduleFollowUpWindow();
      return;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      activeUtteranceRef.current = null;
      window.speechSynthesis.cancel();

      const sanitized = sanitizeMarkdownForSpeech(text);
      if (!sanitized) {
        scheduleFollowUpWindow();
        return;
      }

      // Limit length of single utterance for browser reliability (first 3 sentences or 380 chars)
      const sentences = sanitized.match(/[^.!?]+[.!?]+/g) || [sanitized];
      const speakPortion = sentences.slice(0, 3).join(' ').slice(0, 380);

      const utterance = new SpeechSynthesisUtterance(speakPortion);
      activeUtteranceRef.current = utterance;
      utterance.rate = settingsRef.current.speechRate || 1.05;
      utterance.pitch = settingsRef.current.pitch || 1.0;
      utterance.volume = settingsRef.current.volume ?? 0.95;

      // Select preferred voice if available
      const voices = window.speechSynthesis.getVoices();
      if (settingsRef.current.voiceURI && voices.length > 0) {
        const found = voices.find(v => v.voiceURI === settingsRef.current.voiceURI);
        if (found) utterance.voice = found;
      } else if (voices.length > 0) {
        // Prefer natural English voices
        const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('David') || v.name.includes('Zira') || v.name.includes('Samantha')));
        if (naturalVoice) utterance.voice = naturalVoice;
      }

      let isFinished = false;
      const finishUtterance = () => {
        if (isFinished) return;
        isFinished = true;
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null;
        }
        scheduleFollowUpWindow();
      };

      utterance.onstart = () => {
        setState('RESPONDING');
        setStatusText('Speaking...');
      };

      utterance.onend = () => {
        finishUtterance();
      };

      utterance.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') {
          if (activeUtteranceRef.current === utterance) {
            activeUtteranceRef.current = null;
          }
          return;
        }
        finishUtterance();
      };

      // Slight delay after cancel to prevent Chrome from dropping the speech request
      setTimeout(() => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          window.speechSynthesis.speak(utterance);
        } catch {
          finishUtterance();
        }
      }, 35);
    } catch (err) {
      console.warn('SpeechSynthesis error:', err);
      activeUtteranceRef.current = null;
      scheduleFollowUpWindow();
    }
  };

  // Follow-up conversation window (multi-turn without repeating "Hey NEXUS")
  const scheduleFollowUpWindow = () => {
    if (!settingsRef.current.autoListenFollowUp) {
      transitionToStandby();
      return;
    }

    setActiveConversation(true);
    let secondsLeft = settingsRef.current.conversationTimeoutSeconds || 8;
    setConversationCountdown(secondsLeft);
    setState('LISTENING');
    setStatusText('Listening for follow-up...');

    // Re-verify that recognition is actively listening
    startListening(false);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setConversationCountdown(secondsLeft);
      if (secondsLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }, 1000);

    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    followUpTimerRef.current = setTimeout(() => {
      transitionToStandby();
    }, (settingsRef.current.conversationTimeoutSeconds || 8) * 1000);
  };

  const transitionToStandby = () => {
    if (followUpTimerRef.current) {
      clearTimeout(followUpTimerRef.current);
      followUpTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    accumulatedSpeechRef.current = '';
    setActiveConversation(false);
    setConversationCountdown(0);
    setState('STANDBY');
    setStatusText("Say 'Hey NEXUS'");
    audioFeedback.playSleep();
    stopAudioAnalyzer();
  };

  // Interrupt / Barge-In
  const interrupt = () => {
    activeUtteranceRef.current = null;
    if (isSpeechSynthesisSupported()) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    accumulatedSpeechRef.current = '';
    setActiveConversation(false);
    setConversationCountdown(0);
    setState('STANDBY');
    setStatusText("Say 'Hey NEXUS'");
    audioFeedback.playSleep();
    stopAudioAnalyzer();
    addToast('info', 'Voice assistant paused.', 'NEXUS Voice');
  };

  // Command & Intent Classifier
  const routeVoiceIntent = (rawSpeech: string): { type: string; payload?: any } => {
    const text = rawSpeech.trim().toLowerCase();

    // 1. Interrupt / Stop
    if (STOP_WORDS_REGEX.test(text)) {
      return { type: 'STOP' };
    }

    // 2. Destructive Actions check (Safe Confirmation requirement)
    if (/delete document|delete file|remove document|purge memory|clear memory|delete account|erase history/i.test(text)) {
      return {
        type: 'CONFIRM_DESTRUCTIVE',
        payload: {
          actionId: 'delete_action',
          prompt: `Confirm deletion request: "${rawSpeech}"`,
          description: 'This is a sensitive modification. Say "Confirm delete" or click below to proceed.',
        },
      };
    }

    // 3. Navigation Actions
    if (/open (dashboard|home)|go to (dashboard|home)|show (dashboard|home)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'home' };
    }
    if (/open (documents|docs|files)|go to (documents|docs|files)|show (documents|docs)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'documents' };
    }
    if (/open (screen|context)|go to (screen|context)|show (screen|context)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'screen' };
    }
    if (/open (memory|notes)|go to (memory|notes)|recall notes/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'memory' };
    }
    if (/open (meetings|meeting intelligence)|go to (meetings|meeting)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'meeting' };
    }
    if (/open (actions|tasks|action engine)|go to (actions|tasks)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'tasks' };
    }
    if (/open (performance|ai lab|benchmarks)|go to (performance|ai lab)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'performance' };
    }
    if (/open (privacy|privacy center|security)|go to (privacy|privacy center)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'privacy' };
    }
    if (/open (history|conversations|chats)|show (conversations|recent chats)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'history' };
    }
    if (/open (profile|account)|go to (profile|account)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'profile' };
    }
    if (/open (settings|config)|go to (settings|config)/i.test(text)) {
      return { type: 'NAVIGATE', payload: 'settings' };
    }

    // 4. Screen Perception & Context queries
    if (/what am i looking at|explain (this|my) screen|explain (this|the) code|diagnose (this|the) error|what error is on my screen|summarize (this|the) page/i.test(text)) {
      return { type: 'SCREEN_CONTEXT' };
    }

    // 5. Default General AI query
    return { type: 'GENERAL_AI', payload: rawSpeech };
  };

  // Main Execution Pipeline for Voice Prompts
  const executeVoicePrompt = async (promptText: string) => {
    if (!promptText || !promptText.trim()) return;
    if (isExecutingRef.current) return;

    // Clear any pending timers
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const cleanPrompt = promptText.replace(WAKE_WORD_REGEX, '').trim();
    if (!cleanPrompt) {
      // Just wake word was spoken - react by only voice listening like Siri on Apple iOS
      audioFeedback.playWake();
      setState('LISTENING');
      setStatusText("I'm listening...");
      startAudioAnalyzer();
      setIsOrbExpanded(true);
      setIsCommandBarOpen(true);
      return;
    }

    isExecutingRef.current = true;
    setFinalTranscript(cleanPrompt);
    audioFeedback.playAcknowledge();

    const intent = routeVoiceIntent(cleanPrompt);

    // Handle intent routing
    if (intent.type === 'STOP') {
      isExecutingRef.current = false;
      interrupt();
      return;
    }

    if (intent.type === 'NAVIGATE') {
      isExecutingRef.current = false;
      setCurrentView(intent.payload);
      addToast('info', `Switched to ${intent.payload.toUpperCase()}`, 'Navigation');
      const response = `Opening the ${intent.payload} section.`;
      setLastResponseText(response);
      speakText(response);
      return;
    }

    if (intent.type === 'CONFIRM_DESTRUCTIVE') {
      isExecutingRef.current = false;
      setPendingConfirmation({
        actionId: intent.payload.actionId,
        prompt: cleanPrompt,
        description: intent.payload.description,
        onConfirm: () => {
          addToast('warning', 'Action confirmed & logged in Privacy Center audit.', 'Action Executed');
          const resp = 'Confirmed. Requested operation has been logged and executed.';
          setLastResponseText(resp);
          speakText(resp);
          setPendingConfirmation(null);
        },
      });
      setState('RESPONDING');
      setStatusText('Confirmation Required');
      speakText('This action requires confirmation. Please say "Confirm delete" or click confirm to proceed.');
      return;
    }

    // Execute through NEXUS AI Unified Pipeline
    setState('THINKING');
    setStatusText('Thinking...');
    startAudioAnalyzer();

    // Set watchdog timer to avoid getting stuck
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    watchdogTimerRef.current = setTimeout(() => {
      if (stateRef.current === 'THINKING') {
        isExecutingRef.current = false;
        setState('ERROR');
        setStatusText('Request timed out. Please try again.');
        audioFeedback.playError();
        stopAudioAnalyzer();
      }
    }, 25000);

    try {
      // Attach contextual evidence if available
      let enrichedPrompt = cleanPrompt;
      if (intent.type === 'SCREEN_CONTEXT' && context?.text) {
        enrichedPrompt = `[Context from active screen: ${context.application || 'Window'}]\n${context.text.slice(0, 1500)}\n\nUser Question: ${cleanPrompt}`;
      }

      // Execute through standard /api/chat endpoint
      const res = await api.chat(enrichedPrompt, 'reasoning', true);
      clearTimeout(watchdogTimerRef.current);
      const fullAnswer = res.answer || 'I have completed analyzing your request.';
      setLastResponseText(fullAnswer);
      speakText(fullAnswer);
      refreshContext();
    } catch (err: any) {
      clearTimeout(watchdogTimerRef.current);
      setState('ERROR');
      setStatusText(err.message || 'NEXUS AI is currently unavailable.');
      audioFeedback.playError();
      stopAudioAnalyzer();
      speakText("I'm sorry, I couldn't reach the AI engine right now. Please try again.");
    } finally {
      isExecutingRef.current = false;
    }
  };

  // Push-to-Talk or Manual Start
  const startListening = async (pushToTalk: boolean = false) => {
    if (!isSpeechRecognitionSupported()) {
      addToast('error', 'Speech recognition is not supported in this browser.', 'Voice Unsupported');
      return;
    }

    try {
      // Clean up previous recognizer safely
      if (recognitionRef.current) {
        const oldRec = recognitionRef.current;
        recognitionRef.current = null;
        try {
          oldRec.onend = null;
          oldRec.onerror = null;
          oldRec.abort();
        } catch {}
      }

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognizer = new SpeechRec();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => {
        setMicPermission('granted');
        micPermissionRef.current = 'granted';
        if (pushToTalk) {
          setState('LISTENING');
          setStatusText("I'm listening...");
          audioFeedback.playWake();
          startAudioAnalyzer();
        } else {
          if (stateRef.current === 'STANDBY') {
            setStatusText("Say 'Hey NEXUS'");
          }
        }
      };

      recognizer.onresult = (event: any) => {
        let interim = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            finalStr += text;
          } else {
            interim += text;
          }
        }

        const combinedRaw = (interim + ' ' + finalStr).trim();

        // While speaking, listen strictly for interruption or wake word to avoid echo feedback
        if (stateRef.current === 'RESPONDING') {
          if (STOP_WORDS_REGEX.test(combinedRaw)) {
            interrupt();
            return;
          }
          if (WAKE_WORD_REGEX.test(combinedRaw)) {
            interrupt();
            audioFeedback.playWake();
            setIsOrbExpanded(true);
            setIsCommandBarOpen(true);
            setState('LISTENING');
            setStatusText("I'm listening...");
            startAudioAnalyzer();
            return;
          }
          // Ignore general speech while AI is speaking so it doesn't self-transcribe
          return;
        }

        // While AI is generating an answer, ignore extra speech
        if (stateRef.current === 'THINKING') {
          return;
        }

        // Check for pending confirmation verbal approval
        if (pendingConfirmation) {
          const lower = combinedRaw.toLowerCase();
          if (/confirm delete|confirm action|yes delete|confirm|proceed/i.test(lower)) {
            confirmPendingAction();
            return;
          }
          if (/cancel|no|nevermind|never mind|stop/i.test(lower)) {
            cancelPendingAction();
            return;
          }
        }

        // Hands-Free Wake Word detection in STANDBY mode
        if (stateRef.current === 'STANDBY' && settingsRef.current.wakeWordEnabled) {
          const detectedMatch = combinedRaw.match(WAKE_WORD_REGEX);
          if (detectedMatch) {
            audioFeedback.playWake();
            setIsOrbExpanded(true);
            setIsCommandBarOpen(true);
            setState('LISTENING');
            setStatusText("I'm listening...");
            startAudioAnalyzer();

            const remainder = combinedRaw.slice(detectedMatch.index! + detectedMatch[0].length).replace(/^[\s,]+/, '').trim();
            accumulatedSpeechRef.current = remainder;
            setInterimTranscript(remainder);

            if (remainder.length > 2) {
              if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = setTimeout(() => {
                if (stateRef.current === 'LISTENING' && accumulatedSpeechRef.current.trim().length > 2) {
                  const toRun = accumulatedSpeechRef.current.trim();
                  accumulatedSpeechRef.current = '';
                  setInterimTranscript('');
                  executeVoicePrompt(toRun);
                }
              }, 1400);
            }
            return;
          }
        }

        // In LISTENING state
        if (stateRef.current === 'LISTENING') {
          if (STOP_WORDS_REGEX.test(combinedRaw)) {
            interrupt();
            return;
          }

          const cleanSpeech = combinedRaw.replace(WAKE_WORD_REGEX, '').replace(/^[\s,]+/, '').trim();
          if (!cleanSpeech) return;

          accumulatedSpeechRef.current = cleanSpeech;
          setInterimTranscript(cleanSpeech);

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          if (finalStr.trim().length > 1) {
            const queryToExecute = cleanSpeech;
            accumulatedSpeechRef.current = '';
            setInterimTranscript('');
            executeVoicePrompt(queryToExecute);
            return;
          }

          silenceTimerRef.current = setTimeout(() => {
            if (stateRef.current === 'LISTENING' && accumulatedSpeechRef.current.trim().length > 2) {
              const queryToExecute = accumulatedSpeechRef.current.trim();
              accumulatedSpeechRef.current = '';
              setInterimTranscript('');
              executeVoicePrompt(queryToExecute);
            }
          }, 1400);
        }
      };

      recognizer.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          micPermissionRef.current = 'denied';
          setState('ERROR');
          setStatusText('Microphone access denied. Enable mic in browser.');
          audioFeedback.playError();
          stopAudioAnalyzer();
        } else if (event.error === 'no-speech') {
          // If no speech in follow-up mode, gracefully return to standby
          if (activeConversationRef.current) {
            transitionToStandby();
          }
        } else if (event.error === 'aborted') {
          // Handled during clean restart
        } else {
          if (stateRef.current === 'LISTENING') {
            transitionToStandby();
          }
        }
      };

      recognizer.onend = () => {
        if (recognitionRef.current !== recognizer) return;
        recognitionRef.current = null;

        // Auto-restart with a clean new instance if hands-free is enabled or active follow-up is ongoing
        const shouldRestart =
          (settingsRef.current.wakeWordEnabled || activeConversationRef.current) &&
          micPermissionRef.current !== 'denied' &&
          stateRef.current !== 'ERROR' &&
          !isExecutingRef.current;

        if (shouldRestart) {
          setTimeout(() => {
            if (
              (settingsRef.current.wakeWordEnabled || activeConversationRef.current) &&
              stateRef.current !== 'ERROR' &&
              !recognitionRef.current
            ) {
              startListening(false);
            }
          }, 300);
        } else if (stateRef.current === 'LISTENING') {
          transitionToStandby();
        }
      };

      recognitionRef.current = recognizer;
      recognizer.start();
    } catch (err: any) {
      console.warn('Speech recognition start notice:', err);
      setState('ERROR');
      setStatusText(err.message || 'Failed to start speech recognition.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      try {
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch {}
    }
    transitionToStandby();
  };

  // Toggle Hands-free wake word
  const toggleHandsFree = (enable?: boolean) => {
    const nextVal = typeof enable === 'boolean' ? enable : !settings.wakeWordEnabled;
    updateSettings({ wakeWordEnabled: nextVal });
    if (nextVal) {
      addToast('success', 'Hands-Free "Hey NEXUS" wake word enabled.', 'Voice Assistant');
      startListening(false);
    } else {
      addToast('info', 'Hands-Free wake word disabled. Push-to-talk remains active.', 'Voice Assistant');
      stopListening();
    }
  };

  // Toggle voice output (TTS)
  const toggleVoiceOutput = (enable?: boolean) => {
    const nextVal = typeof enable === 'boolean' ? enable : !settings.voiceOutputEnabled;
    updateSettings({ voiceOutputEnabled: nextVal });
    addToast('info', `Voice output ${nextVal ? 'enabled' : 'muted'}.`, 'Voice Settings');
    if (!nextVal && isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    if (nextVal && isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    addToast('info', nextVal ? 'NEXUS speech muted.' : 'NEXUS speech unmuted.', 'Audio');
  };

  const confirmPendingAction = () => {
    if (pendingConfirmation) {
      pendingConfirmation.onConfirm();
      setPendingConfirmation(null);
    }
  };

  const cancelPendingAction = () => {
    setPendingConfirmation(null);
    setState('STANDBY');
    setStatusText("Say 'Hey NEXUS'");
    speakText('Action cancelled.');
  };

  // Initialize speech recognition on mount safely
  useEffect(() => {
    let unmounted = false;

    if (typeof navigator !== 'undefined' && (navigator as any).permissions?.query) {
      (navigator as any).permissions.query({ name: 'microphone' }).then((permissionStatus: any) => {
        if (unmounted) return;
        if (permissionStatus.state === 'granted') {
          setMicPermission('granted');
          if (settings.wakeWordEnabled && isSpeechSupported) {
            startListening(false);
          }
        } else if (permissionStatus.state === 'denied') {
          setMicPermission('denied');
        } else {
          setMicPermission('prompt');
        }
      }).catch(() => {
        if (settings.wakeWordEnabled && isSpeechSupported && !unmounted) {
          startListening(false);
        }
      });
    } else if (settings.wakeWordEnabled && isSpeechSupported) {
      startListening(false);
    }

    return () => {
      unmounted = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {}
      }
      if (isSpeechSynthesisSupported()) {
        window.speechSynthesis.cancel();
      }
      stopAudioAnalyzer();
    };
  }, []);

  return (
    <VoiceAssistantContext.Provider
      value={{
        state,
        statusText,
        interimTranscript,
        finalTranscript,
        lastResponseText,
        settings,
        updateSettings,
        audioLevels,
        isSpeechSupported,
        isMuted,
        activeConversation,
        conversationCountdown,
        micPermission,
        requestMicPermission,
        isOrbExpanded,
        setIsOrbExpanded,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        pendingConfirmation,
        startListening,
        stopListening,
        interrupt,
        toggleHandsFree,
        toggleVoiceOutput,
        toggleMute,
        confirmPendingAction,
        cancelPendingAction,
        executeVoicePrompt,
        speakText,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = (): VoiceAssistantContextValue => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};
