/**
 * NEXUS AI - Global Voice Indicator
 * Compact status badge displayed in the titlebar/header.
 * Clearly displays active microphone state and provides 1-click access.
 */

import React from 'react';
import { Mic, MicOff, Volume2, Sparkles, Radio } from 'lucide-react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext.js';

export const GlobalVoiceIndicator: React.FC = () => {
  const {
    state,
    settings,
    isSpeechSupported,
    isOrbExpanded,
    setIsOrbExpanded,
    startListening,
    micPermission,
    requestMicPermission,
  } = useVoiceAssistant();

  if (!isSpeechSupported) return null;

  const handleClick = () => {
    if (micPermission === 'denied') {
      requestMicPermission();
      return;
    }
    setIsOrbExpanded(!isOrbExpanded);
    if (state === 'STANDBY' && !isOrbExpanded) {
      startListening(true);
    }
  };

  const getIndicatorContent = () => {
    if (micPermission === 'denied') {
      return {
        icon: MicOff,
        dot: 'bg-rose-500',
        text: '✕ MIC OFF',
        textClass: 'text-rose-400',
        bgClass: 'bg-rose-500/10 border-rose-500/25',
        title: 'Microphone permission denied in browser.',
      };
    }

    if (!settings.wakeWordEnabled && state === 'STANDBY') {
      return {
        icon: Mic,
        dot: 'bg-neutral-500',
        text: '● PUSH-TO-TALK',
        textClass: 'text-neutral-400',
        bgClass: 'bg-neutral-850 border-neutral-750',
        title: 'Hands-free wake word is disabled. Click to speak.',
      };
    }

    switch (state) {
      case 'LISTENING':
        return {
          icon: Radio,
          dot: 'bg-emerald-400 animate-pulse',
          text: '◉ LISTENING',
          textClass: 'text-emerald-400 font-semibold',
          bgClass: 'bg-emerald-500/15 border-emerald-500/35',
          title: 'NEXUS is actively listening for your speech...',
        };
      case 'THINKING':
        return {
          icon: Sparkles,
          dot: 'bg-indigo-400 animate-spin',
          text: '✦ THINKING',
          textClass: 'text-indigo-300 font-semibold',
          bgClass: 'bg-indigo-500/15 border-indigo-500/35',
          title: 'Processing your request...',
        };
      case 'RESPONDING':
        return {
          icon: Volume2,
          dot: 'bg-cyan-400 animate-pulse',
          text: '◉ SPEAKING',
          textClass: 'text-cyan-300 font-semibold',
          bgClass: 'bg-cyan-500/15 border-cyan-500/35',
          title: 'Speaking answer...',
        };
      case 'ERROR':
        return {
          icon: MicOff,
          dot: 'bg-amber-400',
          text: '▲ VOICE NOTICE',
          textClass: 'text-amber-400 font-semibold',
          bgClass: 'bg-amber-500/15 border-amber-500/35',
          title: 'Voice error occurred. Click to retry.',
        };
      case 'STANDBY':
      default:
        return {
          icon: Mic,
          dot: 'bg-cyan-400 animate-subtle-pulse',
          text: '● HEY NEXUS',
          textClass: 'text-cyan-300 font-medium',
          bgClass: 'bg-cyan-500/10 border-cyan-500/25',
          title: 'Hands-free ready. Say "Hey NEXUS" or click to speak.',
        };
    }
  };

  const indicator = getIndicatorContent();
  const Icon = indicator.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={indicator.title}
      aria-label="Toggle NEXUS Voice Assistant"
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-mono transition-all duration-200 cursor-pointer hover:brightness-110 active:scale-95 ${indicator.bgClass}`}
    >
      <Icon className={`w-3 h-3 ${indicator.textClass}`} />
      <span className={indicator.textClass}>{indicator.text}</span>
    </button>
  );
};
