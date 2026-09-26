/**
 * NEXUS AI - Intent Classification Engine
 * Accurately classifies user queries into appropriate operational intents.
 */

export type QueryIntent =
  | 'GENERAL_CHAT'
  | 'KNOWLEDGE_SEARCH'
  | 'CODE_ANALYSIS'
  | 'SCREEN_ANALYSIS'
  | 'DOCUMENT_ANALYSIS'
  | 'MEMORY_SEARCH'
  | 'MEETING_QUERY'
  | 'SYSTEM_COMMAND';

export interface IntentClassificationResult {
  intent: QueryIntent;
  confidence: number;
  requiresScreenContext: boolean;
  requiresDocumentContext: boolean;
  requiresMemoryContext: boolean;
  requiresMeetingContext: boolean;
  searchQuery?: string;
}

export class IntentClassifier {
  public static classify(query: string, activeContext?: any): IntentClassificationResult {
    const q = query.trim().toLowerCase();

    // 1. SYSTEM COMMANDS
    if (
      q === 'status' ||
      q.includes('hardware status') ||
      q.includes('system spec') ||
      q.includes('toggle mode') ||
      q.includes('clear memory')
    ) {
      return {
        intent: 'SYSTEM_COMMAND',
        confidence: 0.95,
        requiresScreenContext: false,
        requiresDocumentContext: false,
        requiresMemoryContext: false,
        requiresMeetingContext: false,
      };
    }

    // 2. SCREEN ANALYSIS
    // Explicit mentions of screen, active window, visible error, or asking what is on screen
    if (
      q.includes('on my screen') ||
      q.includes('on the screen') ||
      q.includes('what am i looking at') ||
      q.includes('what error is visible') ||
      q.includes('what is wrong with this code') ||
      q.includes('why is this failing') ||
      q.includes('diagnose this error') ||
      q.includes('fix this error') ||
      q.includes('active window') ||
      q.includes('screen context') ||
      q.includes('terminal error') ||
      q.includes('traceback')
    ) {
      return {
        intent: 'SCREEN_ANALYSIS',
        confidence: 0.98,
        requiresScreenContext: true,
        requiresDocumentContext: false,
        requiresMemoryContext: false,
        requiresMeetingContext: false,
      };
    }

    // 3. CODE ANALYSIS
    // Code specific questions not explicitly asking about screen
    if (
      q.startsWith('explain this code') ||
      q.includes('review this function') ||
      q.includes('write a python') ||
      q.includes('write a function') ||
      q.includes('optimize this algorithm') ||
      q.includes('refactor') ||
      q.includes('syntax error') ||
      q.includes('time complexity')
    ) {
      // If code was pasted or screen has code
      const hasCodeContext = activeContext?.text && (activeContext.text.includes('def ') || activeContext.text.includes('function') || activeContext.text.includes('import '));
      return {
        intent: 'CODE_ANALYSIS',
        confidence: 0.92,
        requiresScreenContext: hasCodeContext,
        requiresDocumentContext: false,
        requiresMemoryContext: false,
        requiresMeetingContext: false,
      };
    }

    // 4. DOCUMENT ANALYSIS
    if (
      q.includes('summarize this document') ||
      q.includes('summarize this pdf') ||
      q.includes('in the whitepaper') ||
      q.includes('document says') ||
      q.includes('compare the documents') ||
      q.includes('architecture spec') ||
      q.includes('indexed paper') ||
      q.includes('read document') ||
      q.includes('from the document')
    ) {
      const docSearchQuery = q.replace(/summarize this document|summarize this pdf|summarize the document|in the whitepaper|what does the document say about/gi, '').trim();
      return {
        intent: 'DOCUMENT_ANALYSIS',
        confidence: 0.95,
        requiresScreenContext: false,
        requiresDocumentContext: true,
        requiresMemoryContext: false,
        requiresMeetingContext: false,
        searchQuery: docSearchQuery || q,
      };
    }

    // 5. MEMORY SEARCH
    if (
      q.startsWith('what did i save') ||
      q.startsWith('search my memory') ||
      q.startsWith('search memory') ||
      q.includes('in my notes') ||
      q.includes('saved about') ||
      q.includes('recall note') ||
      q.includes('what did i note') ||
      q.startsWith('remember that') ||
      q.startsWith('save to memory')
    ) {
      const memQuery = q.replace(/what did i save about|search my memory for|search memory for|search memory|in my notes about|saved about/gi, '').trim();
      return {
        intent: 'MEMORY_SEARCH',
        confidence: 0.95,
        requiresScreenContext: false,
        requiresDocumentContext: false,
        requiresMemoryContext: true,
        requiresMeetingContext: false,
        searchQuery: memQuery,
      };
    }

    // 6. MEETING QUERY
    if (
      q.includes('summarize my meeting') ||
      q.includes('summarize the meeting') ||
      q.includes('meeting notes') ||
      q.includes('meeting decisions') ||
      q.includes('who attended the meeting') ||
      q.includes('recent sync') ||
      q.includes('action items from meeting')
    ) {
      return {
        intent: 'MEETING_QUERY',
        confidence: 0.95,
        requiresScreenContext: false,
        requiresDocumentContext: false,
        requiresMemoryContext: false,
        requiresMeetingContext: true,
      };
    }

    // 7. GENERAL CHAT (Greetings, Small Talk, Jokes)
    const greetingWords = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'yo'];
    const cleanWord = q.replace(/[^a-z]/g, '');
    if (
      greetingWords.includes(cleanWord) ||
      q.startsWith('hi ') ||
      q.startsWith('hello ') ||
      q.startsWith('hey ') ||
      q === 'how are you' ||
      q === 'how are you?' ||
      q.includes('tell me a joke') ||
      q.includes('make me laugh') ||
      q === 'who are you' ||
      q === 'who are you?' ||
      q === 'what are you' ||
      q === 'what is your name' ||
      q.includes('what can you do')
    ) {
      return {
        intent: 'GENERAL_CHAT',
        confidence: 0.98,
        requiresScreenContext: false,
        requiresDocumentContext: false,
        requiresMemoryContext: false,
        requiresMeetingContext: false,
      };
    }

    // 8. KNOWLEDGE SEARCH (Concepts, explanations, educational questions)
    if (
      q.startsWith('what is ') ||
      q.startsWith('what are ') ||
      q.startsWith('explain ') ||
      q.startsWith('define ') ||
      q.startsWith('how does ') ||
      q.startsWith('how do ') ||
      q.startsWith('why is ') ||
      q.startsWith('difference between ') ||
      q.includes('overview of')
    ) {
      return {
        intent: 'KNOWLEDGE_SEARCH',
        confidence: 0.90,
        requiresScreenContext: false,
        requiresDocumentContext: false,
        requiresMemoryContext: false,
        requiresMeetingContext: false,
        searchQuery: q,
      };
    }

    // Default to GENERAL_CHAT / KNOWLEDGE
    return {
      intent: 'GENERAL_CHAT',
      confidence: 0.75,
      requiresScreenContext: false,
      requiresDocumentContext: false,
      requiresMemoryContext: false,
      requiresMeetingContext: false,
      searchQuery: q,
    };
  }
}
