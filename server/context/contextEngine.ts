/**
 * NEXUS AI - Context Fusion Engine
 * Combines screen perception, OCR tokens, documents, audio transcripts,
 * and local memory into a single structured ContextObject.
 */

import { ContextObject } from '../../src/types/index.js';

export interface ContextPermissions {
  screenAccess: boolean;
  microphoneAccess: boolean;
  fileAccess: boolean;
}

export class ContextEngine {
  private currentContext: ContextObject;
  private permissions: ContextPermissions = {
    screenAccess: true,
    microphoneAccess: true,
    fileAccess: true,
  };

  constructor() {
    // Seed initial realistic context for developer demo
    this.currentContext = {
      id: 'ctx-init-001',
      timestamp: Date.now(),
      sourceType: 'screen',
      application: 'Visual Studio Code',
      windowTitle: 'app.py - nexus-backend (Python 3.11)',
      text: `Traceback (most recent call last):
  File "/workspace/apps/backend/app.py", line 14, in <module>
    from flask_cors import CORS
ModuleNotFoundError: No module named 'flask_cors'

Process exited with code 1`,
      visualElements: [
        { type: 'code_block', content: 'from flask_cors import CORS', confidence: 0.99, bbox: [120, 80, 580, 240] },
        { type: 'text_box', content: "ModuleNotFoundError: No module named 'flask_cors'", confidence: 0.98, bbox: [120, 400, 620, 520] },
      ],
      detectedLanguage: 'Python / Shell',
      confidence: 0.97,
      privacyLevel: 'local_only',
    };
  }

  public assertPermission(type: 'screen' | 'microphone' | 'file'): void {
    if (type === 'screen' && !this.permissions.screenAccess) {
      throw new Error('Screen perception permission is disabled in Privacy Center. Please grant screen access to continue.');
    }
    if (type === 'microphone' && !this.permissions.microphoneAccess) {
      throw new Error('Microphone audio permission is disabled in Privacy Center. Please grant microphone access to continue.');
    }
    if (type === 'file' && !this.permissions.fileAccess) {
      throw new Error('Local file system permission is disabled in Privacy Center. Please grant file access to continue.');
    }
  }

  public normalizeText(raw: string): string {
    if (!raw) return '';
    // Normalize unicode spaces, strip null bytes, normalize carriage returns
    return raw
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .trim();
  }

  public getPermissions(): ContextPermissions {
    return { ...this.permissions };
  }

  public setPermissions(perms: Partial<ContextPermissions>): ContextPermissions {
    this.permissions = { ...this.permissions, ...perms };
    return this.permissions;
  }

  public getContext(): ContextObject {
    return this.currentContext;
  }

  public updateContext(newContext: Partial<ContextObject>): ContextObject {
    const normalizedText = newContext.text ? this.normalizeText(newContext.text) : this.currentContext.text;

    this.currentContext = {
      ...this.currentContext,
      ...newContext,
      text: normalizedText,
      id: `ctx-${Date.now()}`,
      timestamp: Date.now(),
    };
    return this.currentContext;
  }

  /**
   * Multimodal Context Fusion
   * Fuses incoming visual tokens, documents, or transcripts into active unified context
   */
  public fuseContext(incoming: {
    sourceType?: 'screen' | 'document' | 'voice' | 'clipboard' | 'manual';
    text?: string;
    application?: string;
    windowTitle?: string;
    visualElements?: any[];
    confidence?: number;
    privacyLevel?: 'local_only' | 'sensitive' | 'general';
    screen?: any;
  }): ContextObject {
    const screenData = incoming.screen;
    const sourceType = incoming.sourceType || (screenData ? 'screen' : 'manual');
    const rawText = incoming.text || screenData?.text || screenData?.detectedText || '';
    const cleanText = this.normalizeText(rawText);
    this.currentContext = {
      id: `ctx-${Date.now()}`,
      timestamp: Date.now(),
      sourceType,
      application: incoming.application || screenData?.application || this.currentContext.application,
      windowTitle: incoming.windowTitle || screenData?.windowTitle || this.currentContext.windowTitle,
      text: cleanText,
      visualElements: incoming.visualElements || screenData?.visualElements || this.currentContext.visualElements || [],
      confidence: incoming.confidence ?? screenData?.confidence ?? 0.98,
      privacyLevel: incoming.privacyLevel || screenData?.privacyLevel || 'local_only',
    };
    return this.currentContext;
  }

  public setSampleContext(scenario: 'vscode_error' | 'research_pdf' | 'meeting_whiteboard' | 'clean_desktop'): ContextObject {
    switch (scenario) {
      case 'vscode_error':
        this.currentContext = {
          id: `ctx-${Date.now()}`,
          timestamp: Date.now(),
          sourceType: 'screen',
          application: 'Visual Studio Code',
          windowTitle: 'server.py - Digital Collaborative Whiteboard',
          text: `Traceback (most recent call last):
  File "server.py", line 14, in <module>
    from flask_cors import CORS
ModuleNotFoundError: No module named 'flask_cors'

During handling of the above exception, another exception occurred...`,
          visualElements: [
            { type: 'code_block', content: 'from flask_cors import CORS', confidence: 0.99 },
            { type: 'text_box', content: "ModuleNotFoundError: No module named 'flask_cors'", confidence: 0.98 },
          ],
          detectedLanguage: 'Python',
          confidence: 0.98,
          privacyLevel: 'local_only',
        };
        break;

      case 'research_pdf':
        this.currentContext = {
          id: `ctx-${Date.now()}`,
          timestamp: Date.now(),
          sourceType: 'document',
          application: 'Acrobat / PDF Reader',
          windowTitle: 'Qualcomm_Hexagon_NPU_Architecture_2025.pdf',
          text: `Section 3.2: Hexagon Vector eXtensions (HVX) and Tensor Accelerator (HTA) in Snapdragon X Elite.
The dedicated neural processing unit delivers 45 TOPS of INT8 compute with sub-5ms latency for quantized transformer layers.
By offloading INT8 GEMM operations to the micro-tiled tensor array, system memory bandwidth contention is curtailed by 68%.`,
          visualElements: [
            { type: 'diagram', content: 'Hexagon NPU Tensor Accelerator Dataflow', confidence: 0.94 },
            { type: 'table', content: 'INT8 vs FP16 TOPS Benchmark Matrix', confidence: 0.96 },
          ],
          detectedLanguage: 'English (Technical)',
          documentMetadata: {
            filename: 'Qualcomm_Hexagon_NPU_Architecture_2025.pdf',
            pageCount: 18,
            mimeType: 'application/pdf',
          },
          confidence: 0.96,
          privacyLevel: 'sensitive',
        };
        break;

      case 'meeting_whiteboard':
        this.currentContext = {
          id: `ctx-${Date.now()}`,
          timestamp: Date.now(),
          sourceType: 'voice',
          application: 'Microsoft Teams / Meeting Mode',
          windowTitle: 'Team Architecture Sync: Edge AI Deployment',
          text: `Transcript snippet:
[09:12] Dave: We verified that QNN Execution Provider operates at 45 TOPS on the HP OmniBook X.
[09:13] Sarah: Great, let us establish SQLite for local document vectors and ensure no telemetry leaks.
[09:14] Dave: Action item for Tarun: verify the fallback adapter when running without physical NPU.`,
          visualElements: [
            { type: 'text_box', content: 'Action item: verify fallback adapter', confidence: 0.95 },
          ],
          detectedLanguage: 'English',
          confidence: 0.95,
          privacyLevel: 'sensitive',
        };
        break;

      case 'clean_desktop':
      default:
        this.currentContext = {
          id: `ctx-${Date.now()}`,
          timestamp: Date.now(),
          sourceType: 'manual',
          application: 'NEXUS AI Workspace',
          windowTitle: 'Idle Workspace',
          text: 'Ready to perceive screen, documents, microphone, or local knowledge.',
          confidence: 1.0,
          privacyLevel: 'local_only',
        };
        break;
    }

    return this.currentContext;
  }
}
