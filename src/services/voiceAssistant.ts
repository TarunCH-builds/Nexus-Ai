/**
 * NEXUS AI - Hands-Free Voice Assistant Engine
 * 
 * Provides local wake-word detection ("Hey NEXUS", "Hi NEXUS"),
 * speech-to-text recognition, text-to-speech output with markdown sanitization,
 * barge-in interruption, and command routing.
 */

export type VoiceState = 'STANDBY' | 'LISTENING' | 'THINKING' | 'RESPONDING' | 'ERROR';

export interface VoiceSettings {
  wakeWordEnabled: boolean;
  voiceOutputEnabled: boolean;
  speechRate: number; // 0.8 - 1.5
  volume: number; // 0.0 - 1.0
  pitch: number; // 0.8 - 1.2
  voiceURI?: string;
  conversationTimeoutSeconds: number; // 4 - 20
  autoListenFollowUp: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  wakeWordEnabled: true,
  voiceOutputEnabled: true,
  speechRate: 1.05,
  volume: 0.95,
  pitch: 1.0,
  conversationTimeoutSeconds: 8,
  autoListenFollowUp: true,
};

export const WAKE_WORD_REGEX = /\b(?:hey|hi|hello|ok|okay)[\s,]+(?:nexus|nexis|nexas)\b|^\s*(?:nexus|nexis|nexas)\b/i;
export const STOP_WORDS_REGEX = /\b(?:stop|cancel|quiet|be quiet|shut up|pause|halt|nevermind|never mind|dismiss|close|exit|go away)\b/i;


/**
 * Sanitizes markdown syntax so SpeechSynthesis reads smooth, natural language
 * instead of raw markdown symbols or code syntax.
 */
export function sanitizeMarkdownForSpeech(text: string): string {
  if (!text) return '';
  return text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' [code block omitted] ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold/italic markers
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    // Remove headers (# Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Replace bullet points with brief pauses
    .replace(/^\s*[-*+]\s+/gm, '. ')
    // Replace numbered lists with natural speech
    .replace(/^\s*\d+\.\s+/gm, '. ')
    // Replace multiple newlines or spaces with single period/space
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    // Clean up double punctuation
    .replace(/\.{2,}/g, '.')
    .replace(/\s*([.,?!])\s*/g, '$1 ')
    .trim();
}

/**
 * Checks if SpeechRecognition is supported in the browser.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Checks if SpeechSynthesis is supported in the browser.
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}
