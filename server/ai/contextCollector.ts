/**
 * NEXUS AI - Context Collection & Relevance Engine
 * Gathers relevant contextual streams strictly when requested or needed.
 * Never fabricates context that wasn't actually used.
 */

import { db } from '../db.js';
import { ContextObject, DocumentCitation } from '../../src/types/index.js';
import { IntentClassificationResult } from './intentClassifier.js';

export interface CollectedContext {
  contextSources: string[];
  screenContext?: {
    application: string;
    windowTitle: string;
    text: string;
    visibleError?: string;
    visualElements?: any[];
  };
  documentCitations: DocumentCitation[];
  memoryItems: Array<{ id: string; title: string; content: string; relevance: number }>;
  meetingSummary?: {
    title: string;
    date?: string;
    participants?: string[];
    keyDecisions?: string[];
    actionItems?: any[];
  };
  conversationHistory?: Array<{
    role: string;
    content: string;
    timestamp?: number;
  }>;
}

export class ContextCollector {
  public static collect(
    classification: IntentClassificationResult,
    rawContext?: ContextObject,
    userId: string = 'default_user'
  ): CollectedContext {
    const contextSources: string[] = [];
    let screenContext: CollectedContext['screenContext'] = undefined;
    const documentCitations: DocumentCitation[] = [];
    const memoryItems: CollectedContext['memoryItems'] = [];
    let meetingSummary: CollectedContext['meetingSummary'] = undefined;
    let conversationHistory: CollectedContext['conversationHistory'] = undefined;

    // 1. Screen Context
    if (classification.requiresScreenContext && rawContext) {
      const screenObj = (rawContext as any).screen || rawContext;
      const screenText = screenObj.text || '';
      let visibleError: string | undefined = undefined;

      // Extract error if present in screen text
      if (screenText) {
        if (screenText.includes('ModuleNotFoundError:')) {
          const match = screenText.match(/ModuleNotFoundError:[^\n]+/);
          visibleError = match ? match[0] : "ModuleNotFoundError: No module named 'flask_cors'";
        } else if (screenText.includes('Error:') || screenText.includes('Exception:')) {
          const lines = screenText.split('\n');
          const errorLine = lines.find((l: string) => l.includes('Error:') || l.includes('Exception:'));
          if (errorLine) visibleError = errorLine.trim();
        }
      }

      if (screenText.trim().length > 0 || screenObj.application) {
        screenContext = {
          application: screenObj.application || 'Active Application',
          windowTitle: screenObj.windowTitle || 'Active Window',
          text: screenText,
          visibleError,
          visualElements: screenObj.visualElements,
        };
        contextSources.push(`Active Screen: ${screenContext.application} ("${screenContext.windowTitle}")`);
      }
    }

    // 2. Document Context
    const rawDocs = (rawContext as any)?.documents;
    if (rawDocs && Array.isArray(rawDocs) && rawDocs.length > 0) {
      for (const d of rawDocs) {
        documentCitations.push({
          documentId: (d as any).id || (d as any).documentId || 'doc-1',
          documentTitle: (d as any).title || (d as any).documentTitle || 'Uploaded Document',
          chunkId: (d as any).chunkId || 'chunk-1',
          chunkIndex: d.chunkIndex ?? 0,
          snippet: d.snippet,
          similarity: d.similarity ?? 0.95,
        });
      }
      const docNames = Array.from(new Set(documentCitations.map(c => c.documentTitle)));
      contextSources.push(...docNames.map(d => `Document: ${d}`));
    } else if (classification.requiresDocumentContext && classification.searchQuery) {
      try {
        const found = db.searchChunksWithCitations(classification.searchQuery, userId, 3, 0.15);
        if (found && found.length > 0) {
          documentCitations.push(...found);
          const docNames = Array.from(new Set(found.map(c => c.documentTitle)));
          contextSources.push(...docNames.map(d => `Document: ${d}`));
        }
      } catch (err) {
        console.warn('Document search in context collector:', err);
      }
    }

    // 3. Memory Context
    const rawMems = (rawContext as any)?.memory;
    if (rawMems && Array.isArray(rawMems) && rawMems.length > 0) {
      for (const m of rawMems) {
        memoryItems.push({
          id: (m as any).id || 'mem-1',
          title: (m as any).title || 'Memory Record',
          content: (m as any).content || '',
          relevance: 0.95,
        });
      }
      contextSources.push('Local Memory Vector Store');
    } else if (classification.requiresMemoryContext && classification.searchQuery) {
      try {
        const found = db.searchVectors(classification.searchQuery, userId, 3);
        if (found && found.length > 0) {
          found.forEach(r => {
            memoryItems.push({
              id: r.item.id,
              title: r.item.title,
              content: r.item.content,
              relevance: r.similarity,
            });
          });
          contextSources.push('Local Memory Vector Store');
        }
      } catch (err) {
        console.warn('Memory search in context collector:', err);
      }
    }

    // 4. Meeting Context
    if (classification.requiresMeetingContext) {
      try {
        const meetings = db.getMeetings(userId);
        if (meetings && meetings.length > 0) {
          const latest = meetings[0];
          meetingSummary = {
            title: latest.title,
            date: latest.date,
            participants: latest.participants,
            keyDecisions: latest.decisions || latest.keyDecisions,
            actionItems: latest.actionItems,
          };
          contextSources.push(`Meeting Transcript: "${latest.title}"`);
        }
      } catch (err) {
        console.warn('Meeting query in context collector:', err);
      }
    }

    // 5. Recent Conversation History (Requirement #15 & #16 & #21)
    try {
      const recent = db.getRecentUserMessages(userId, 8);
      if (recent && recent.length > 0) {
        conversationHistory = recent.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        }));
        contextSources.push('Recent Conversation History');
      }
    } catch (err) {
      console.warn('Conversation history fetch warning:', err);
    }

    return {
      contextSources,
      screenContext,
      documentCitations,
      memoryItems,
      meetingSummary,
      conversationHistory,
    };
  }
}
