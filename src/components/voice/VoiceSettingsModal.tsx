/**
 * NEXUS AI - Voice Assistant Settings & Calibration Modal
 * 
 * Provides:
 * - Hands-free wake word toggle ("Hey NEXUS", "Hi NEXUS")
 * - Voice output (TTS) toggle & voice selector
 * - Speech rate & volume calibration
 * - Multi-turn follow-up timeout slider
 * - Accurate technical privacy disclosure
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Mic,
  Volume2,
  Sliders,
  ShieldCheck,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext.js';
import { audioFeedback } from '../../services/voiceFeedback.js';

export const VoiceSettingsModal: React.FC = () => {
  const {
    settings,
    updateSettings,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    speakText,
    micPermission,
  } = useVoiceAssistant();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer English voices
        const enVoices = voices.filter(v => v.lang.startsWith('en'));
        setAvailableVoices(enVoices.length > 0 ? enVoices : voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isSettingsModalOpen) return null;

  const handleTestTone = () => {
    audioFeedback.playWake();
  };

  const handleTestVoice = () => {
    speakText("Hello! I am NEXUS, your hands-free desktop AI assistant. Ready to help.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0c101a] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-neutral-100">
                Voice Assistant & "Hey NEXUS" Settings
              </h2>
              <p className="text-[11px] text-neutral-400">
                Configure on-device wake-word detection, speech synthesis, & privacy controls
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Section 1: Hands-Free Wake Word */}
          <div className="space-y-3 p-3.5 rounded-xl bg-neutral-900/60 border border-white/[0.06]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium text-xs text-neutral-200">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hands-Free "Hey NEXUS" Wake Word</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Continuously listen locally for "Hey NEXUS" or "Hi NEXUS" to activate without touching the keyboard.
                </p>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.wakeWordEnabled}
                  onChange={(e) => updateSettings({ wakeWordEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {/* Test Wake Chime Button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
              <span className="text-[11px] text-neutral-400">Audio cue on wake detection:</span>
              <button
                type="button"
                onClick={handleTestTone}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-cyan-300 border border-cyan-500/20 transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Test Wake Chime</span>
              </button>
            </div>
          </div>

          {/* Section 2: Multi-turn Natural Conversation Timeout */}
          <div className="space-y-3 p-3.5 rounded-xl bg-neutral-900/60 border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium text-xs text-neutral-200">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Natural Follow-Up Window</span>
              </div>
              <span className="font-mono text-xs text-cyan-400 font-semibold">
                {settings.conversationTimeoutSeconds}s
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Duration NEXUS continues listening for follow-up questions after an answer without repeating "Hey NEXUS".
            </p>
            <input
              type="range"
              min="4"
              max="20"
              step="1"
              value={settings.conversationTimeoutSeconds}
              onChange={(e) => updateSettings({ conversationTimeoutSeconds: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Section 3: Text-to-Speech (Voice Output) */}
          <div className="space-y-3.5 p-3.5 rounded-xl bg-neutral-900/60 border border-white/[0.06]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium text-xs text-neutral-200">
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Spoken Voice Output (TTS)</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  NEXUS speaks synthesized answers aloud while simultaneously rendering the text response.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.voiceOutputEnabled}
                  onChange={(e) => updateSettings({ voiceOutputEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>

            {settings.voiceOutputEnabled && (
              <div className="space-y-3 pt-2 border-t border-white/[0.04]">
                {/* Voice Selection */}
                {availableVoices.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-neutral-300 font-medium">Assistant Voice</label>
                    <select
                      value={settings.voiceURI || ''}
                      onChange={(e) => updateSettings({ voiceURI: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-white/[0.1] text-xs text-neutral-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Default OS Natural Voice</option>
                      {availableVoices.map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Speech Speed */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300">Speech Rate</span>
                    <span className="font-mono text-neutral-400">{(settings.speechRate ?? 1.05).toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.05"
                    value={settings.speechRate ?? 1.05}
                    onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300">Voice Volume</span>
                    <span className="font-mono text-neutral-400">{Math.round((settings.volume ?? 0.95) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={settings.volume ?? 0.95}
                    onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                    className="w-full accent-indigo-400 cursor-pointer"
                  />
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Test Voice Speech</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Privacy & Technical Verification Note */}
          <div className="p-3.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified On-Device Privacy Architecture</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Wake word detection is running locally on your device via client speech recognition. Zero microphone audio is continuously uploaded to external cloud servers during standby. Audio buffers are only converted to text upon wake-word detection or manual push-to-talk.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="text-[10px] text-neutral-400">
            Permission: <span className="font-mono text-neutral-200 capitalize">{micPermission}</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
