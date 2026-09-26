/**
 * NEXUS AI - Apple iOS Siri-Style Spatial Voice Assistant HUD
 * 
 * Recreates the Apple iOS Siri voice experience:
 * - Fluid multi-layered liquid Siri orb with vibrant gradients (cyan, magenta, violet, electric blue)
 * - Reactive multi-frequency soundwaves that pulse organically to voice audio levels
 * - Reacts exclusively to voice input ("Hey NEXUS" or 1-tap Siri activation)
 * - Live real-time speech transcription & Apple-style frosted glass response card
 * - Natural multi-turn follow-up listening window
 * - Barge-in / Interrupt control & permission self-recovery
 */

import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  Settings,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext.js';
import { NexusLogo } from '../brand/NexusLogo.js';

export const VoiceOrb: React.FC = () => {
  const {
    state,
    statusText,
    interimTranscript,
    finalTranscript,
    lastResponseText,
    settings,
    audioLevels,
    isSpeechSupported,
    isMuted,
    activeConversation,
    conversationCountdown,
    isOrbExpanded,
    setIsOrbExpanded,
    pendingConfirmation,
    startListening,
    interrupt,
    toggleMute,
    confirmPendingAction,
    cancelPendingAction,
    setIsSettingsModalOpen,
    micPermission,
    requestMicPermission,
    executeVoicePrompt,
  } = useVoiceAssistant();

  if (!isSpeechSupported) {
    return null;
  }

  const isSiriActive = isOrbExpanded || state === 'LISTENING' || state === 'THINKING' || state === 'RESPONDING';

  // State-specific styling
  const getSiriAura = () => {
    switch (state) {
      case 'LISTENING':
        return {
          glow: 'shadow-[0_0_50px_rgba(34,211,238,0.5)] border-cyan-400/50',
          gradient: 'from-cyan-400 via-teal-300 to-indigo-500',
          ring: 'border-cyan-400/60 animate-ping',
          textColor: 'text-cyan-300',
          status: 'Listening...',
        };
      case 'THINKING':
        return {
          glow: 'shadow-[0_0_50px_rgba(168,85,247,0.5)] border-purple-400/50',
          gradient: 'from-purple-500 via-indigo-500 to-cyan-400',
          ring: 'border-purple-400/60 animate-spin',
          textColor: 'text-purple-300',
          status: 'Thinking...',
        };
      case 'RESPONDING':
        return {
          glow: 'shadow-[0_0_55px_rgba(59,130,246,0.55)] border-blue-400/50',
          gradient: 'from-blue-500 via-cyan-400 to-fuchsia-500',
          ring: 'border-blue-400/40 animate-pulse',
          textColor: 'text-blue-300',
          status: 'Speaking...',
        };
      case 'ERROR':
        return {
          glow: 'shadow-[0_0_40px_rgba(244,63,94,0.4)] border-rose-400/50',
          gradient: 'from-rose-500 via-amber-500 to-purple-600',
          ring: 'border-rose-400/40',
          textColor: 'text-rose-300',
          status: 'Voice Notice',
        };
      case 'STANDBY':
      default:
        return {
          glow: 'shadow-[0_0_35px_rgba(99,102,241,0.35)] border-white/20',
          gradient: 'from-cyan-400 via-indigo-500 to-fuchsia-500',
          ring: 'border-indigo-400/20',
          textColor: 'text-neutral-300',
          status: "Say 'Hey NEXUS'",
        };
    }
  };

  const aura = getSiriAura();

  return (
    <>
      {/* Siri Spatial Overlay (Apple iOS Siri Modal / HUD) */}
      {isSiriActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end pb-8 sm:pb-12 pointer-events-none select-none transition-all duration-300 animate-fade-in">
          {/* Subtle Dimmed Ambient Backdrop */}
          <div
            onClick={() => {
              if (state === 'LISTENING' || state === 'RESPONDING') {
                interrupt();
              }
              setIsOrbExpanded(false);
            }}
            className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md pointer-events-auto transition-opacity"
            title="Click to dismiss Siri"
          />

          {/* Siri Floating Island Card */}
          <div className="relative z-10 w-[94vw] sm:w-[460px] max-w-[500px] rounded-3xl bg-[#0c101a]/90 backdrop-blur-2xl border border-white/[0.14] shadow-[0_25px_70px_rgba(0,0,0,0.8)] p-5 text-neutral-100 flex flex-col gap-4 pointer-events-auto transition-all transform animate-in slide-in-from-bottom-6 duration-300">
            {/* Top Control Bar */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <NexusLogo variant="compact" size="xs" showSubtitle={false} />
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] ${aura.textColor}`}>
                  {aura.status}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Audio Output Mute */}
                <button
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                {/* Voice Settings */}
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(true)}
                  title="Voice Settings"
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>

                {/* Close Siri HUD */}
                <button
                  type="button"
                  onClick={() => {
                    if (state === 'LISTENING' || state === 'RESPONDING') {
                      interrupt();
                    }
                    setIsOrbExpanded(false);
                  }}
                  title="Dismiss Siri"
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Microphone Permission Recovery Banner if Blocked */}
            {micPermission === 'denied' && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs">
                  <MicOff className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Microphone access is blocked in your browser.</span>
                </div>
                <button
                  type="button"
                  onClick={requestMicPermission}
                  className="px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-neutral-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Allow Mic
                </button>
              </div>
            )}

            {/* Destructive Action Safe Confirmation Card */}
            {pendingConfirmation && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Confirmation Required</span>
                </div>
                <p className="text-xs text-neutral-300">
                  {pendingConfirmation.description}
                </p>
                <div className="text-[11px] font-mono bg-black/50 px-2.5 py-1.5 rounded-lg text-amber-200 truncate">
                  "{pendingConfirmation.prompt}"
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={confirmPendingAction}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={cancelPendingAction}
                    className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-neutral-300 text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Apple iOS Siri Liquid Wave & Orb Visualizer */}
            <div className="flex flex-col items-center justify-center py-4 relative overflow-hidden">
              {/* Radial Siri Glow Halo */}
              <div
                className={`absolute w-44 h-44 rounded-full bg-gradient-to-tr ${aura.gradient} blur-3xl opacity-35 transition-all duration-500 pointer-events-none`}
              />

              {/* Central Dynamic Siri Liquid Orb */}
              <div className="relative flex items-center justify-center">
                {/* Outer Breathing Energy Ring */}
                <div
                  className={`absolute -inset-3 rounded-full border border-dashed transition-all duration-500 ${aura.ring}`}
                />

                {/* Siri Multi-Layered Liquid Sphere */}
                <div
                  onClick={() => {
                    if (state === 'LISTENING' || state === 'RESPONDING') {
                      interrupt();
                    } else {
                      startListening(true);
                    }
                  }}
                  className={`relative w-20 h-20 rounded-full bg-gradient-to-tr ${aura.gradient} ${aura.glow} flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl`}
                  title={state === 'LISTENING' ? 'Click to stop listening' : 'Click to speak'}
                >
                  {/* Glossy Refraction Highlight */}
                  <div className="absolute top-1.5 left-2 w-7 h-4 rounded-full bg-white/40 blur-[1px] transform -rotate-12" />

                  {/* Core Icon */}
                  {state === 'THINKING' ? (
                    <Sparkles className="w-8 h-8 text-white animate-spin drop-shadow" />
                  ) : state === 'RESPONDING' ? (
                    <Volume2 className="w-8 h-8 text-white animate-pulse drop-shadow" />
                  ) : state === 'LISTENING' ? (
                    <Mic className="w-8 h-8 text-white animate-pulse drop-shadow" />
                  ) : (
                    <Mic className="w-8 h-8 text-white drop-shadow" />
                  )}
                </div>
              </div>

              {/* Reactive Soundwave Frequencies */}
              <div className="flex items-center gap-1.5 h-8 mt-5 px-4">
                {audioLevels.map((lvl, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${Math.max(4, lvl)}px` }}
                    className={`w-1 rounded-full transition-all duration-75 ${
                      state === 'LISTENING'
                        ? 'bg-gradient-to-t from-cyan-400 via-teal-300 to-white shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                        : state === 'THINKING'
                        ? 'bg-gradient-to-t from-purple-400 to-indigo-300 animate-pulse'
                        : state === 'RESPONDING'
                        ? 'bg-gradient-to-t from-blue-400 via-cyan-300 to-white shadow-[0_0_8px_rgba(59,130,246,0.7)]'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Status & Natural Conversation Indicator */}
              <div className="mt-2 text-center">
                <p className="text-sm font-medium text-neutral-200">
                  {statusText}
                </p>

                {activeConversation && conversationCountdown > 0 && (
                  <div className="flex items-center justify-center gap-1 text-[11px] text-cyan-300 font-mono mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Follow-up window: {conversationCountdown}s</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Spoken Transcription & Siri Response Bubble */}
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {/* User Spoken Input */}
              {(interimTranscript || finalTranscript) && (
                <div className="p-3 rounded-2xl bg-neutral-900/90 border border-white/[0.08] shadow-inner">
                  <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                    <span>You said</span>
                  </div>
                  <div className="text-neutral-100 text-sm font-medium leading-relaxed">
                    {finalTranscript || interimTranscript}
                    {interimTranscript && !finalTranscript && (
                      <span className="text-cyan-400 ml-1 animate-pulse">...</span>
                    )}
                  </div>
                </div>
              )}

              {/* Siri AI Spoken Response Card */}
              {lastResponseText && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-cyan-950/30 to-purple-950/40 border border-cyan-500/30 shadow-md">
                  <div className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>NEXUS Siri Response</span>
                    </div>
                    {state === 'RESPONDING' && (
                      <span className="text-[10px] text-cyan-400 font-sans animate-pulse font-semibold">
                        ● Speaking
                      </span>
                    )}
                  </div>
                  <div className="text-neutral-200 text-xs sm:text-sm leading-relaxed line-clamp-5 select-text">
                    {lastResponseText}
                  </div>
                </div>
              )}

              {/* Quick Sample Suggestions when in Standby / Listening with no text */}
              {!interimTranscript && !finalTranscript && !lastResponseText && (
                <div className="pt-1">
                  <div className="text-[10px] font-mono text-neutral-400 mb-1.5 uppercase">
                    Try asking:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'What is on my screen?',
                      'Open the documents page',
                      'Synthesize notes from memory',
                      'Open performance AI lab',
                    ].map((samplePrompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => executeVoicePrompt(samplePrompt)}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{samplePrompt}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-neutral-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Siri Controls */}
            <div className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
              {state === 'RESPONDING' ? (
                <button
                  type="button"
                  onClick={interrupt}
                  className="flex-1 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Speaking</span>
                </button>
              ) : state === 'LISTENING' ? (
                <button
                  type="button"
                  onClick={interrupt}
                  className="flex-1 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Pause Listening</span>
                </button>
              ) : state === 'ERROR' ? (
                <button
                  type="button"
                  onClick={() => startListening(true)}
                  className="flex-1 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Voice Input</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startListening(true)}
                  className="flex-1 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Tap to Speak</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (state === 'LISTENING' || state === 'RESPONDING') {
                    interrupt();
                  }
                  setIsOrbExpanded(false);
                }}
                className="px-4 py-2 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Spatial Siri Orb (Resting in Bottom-Right Corner) */}
      {!isSiriActive && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none pointer-events-auto">
          {/* Subtle Hover Tooltip */}
          <div className="opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity bg-neutral-900/90 text-neutral-200 text-xs px-3 py-1.5 rounded-xl border border-white/[0.1] shadow-xl whitespace-nowrap pointer-events-none">
            {settings.wakeWordEnabled ? "Say 'Hey NEXUS' or click" : 'Click to Speak'}
          </div>

          {/* Glowing Apple Siri Orb Trigger */}
          <button
            type="button"
            onClick={() => {
              setIsOrbExpanded(true);
              startListening(true);
            }}
            aria-label="Hands-free voice assistant trigger"
            className="group relative w-13 h-13 rounded-full flex items-center justify-center bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] border border-white/20 backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
          >
            {/* Ambient Aura Ring */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-400 to-fuchsia-500 opacity-40 blur-sm group-hover:opacity-80 transition-opacity animate-pulse" />

            {/* Specular Glint */}
            <span className="absolute top-1 left-2 w-5 h-3 rounded-full bg-white/40 blur-[1px] transform -rotate-12" />

            {/* Mic Icon */}
            <Mic className="relative z-10 w-6 h-6 text-white drop-shadow-md group-hover:scale-110 transition-transform" />

            {/* Green / Cyan active wake word indicator pip */}
            {settings.wakeWordEnabled && (
              <span
                className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-neutral-950 shadow-sm"
                title="Hands-free 'Hey NEXUS' wake word active"
              />
            )}
          </button>
        </div>
      )}
    </>
  );
};
