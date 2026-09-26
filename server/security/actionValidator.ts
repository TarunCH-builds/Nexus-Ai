/**
 * NEXUS AI - Security Engine & Action Validator
 * 
 * Enforces strict security boundaries on AI-proposed actions:
 * - Multi-tiered risk classification: LOW, MEDIUM, HIGH, CRITICAL
 * - Dangerous shell command & destructive file operation detection
 * - Prompt injection & untrusted context sanitization
 * - Sandboxing & allowlist verification
 * - Explicit user consent requirement for elevated actions
 */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ActionProposal {
  id: string;
  title: string;
  command?: string;
  description: string;
  reason: string;
  source: 'screen' | 'document' | 'meeting' | 'prompt' | 'manual';
  sourceTitle?: string;
  riskLevel: RiskLevel;
  sandboxStatus: 'verified' | 'sandboxed' | 'blocked' | 'requires_elevation';
  safetyViolations: string[];
  userApproved: boolean;
  executed: boolean;
  createdAt: number;
  executedAt?: number;
  outputResult?: string;
}

// Patterns that flag dangerous shell or system actions
const CRITICAL_PATTERNS = [
  /\brm\s+-[rf]{1,2}\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  /\bshutdown\b/i,
  /\breboot\b/i,
  /\b(del|rd|rmdir)\s+\/s\b/i,
  /\bformat\s+[a-z]:/i,
  />\s*\/dev\/sd[a-z]/i,
  /\b(curl|wget)\b.*\|\s*(sh|bash|zsh|powershell)/i,
  /\bchmod\s+777\b/i,
  /\bsudo\s+su\b/i,
  /\bDROP\s+TABLE\b/i,
  /\bDELETE\s+FROM\s+\w+\s*;?$/i, // unconstrained delete
];

const HIGH_PATTERNS = [
  /\b(pip|npm|yarn|pnpm)\s+install\s+-g\b/i,
  /\bpowershell(\.exe)?\s+(-enc|-encodedcommand)/i,
  /\b(reg\s+add|reg\s+delete)\b/i,
  /\bsudo\b/i,
  /\bchmod\b/i,
  /\bchown\b/i,
  /\bgit\s+push\s+--force\b/i,
  /\bkill\s+-9\b/i,
];

const MEDIUM_PATTERNS = [
  /\b(pip|npm|yarn|pnpm)\s+install\b/i,
  /\b(apt|dnf|pacman|brew)\s+install\b/i,
  /\bgit\s+(commit|merge|rebase)\b/i,
  /\bnode\s+/i,
  /\bpython\s+/i,
  /\bdotnet\s+/i,
  /\bcat\s+.*>\b/i,
];

// Prompt injection patterns in untrusted input buffers
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /disregard\s+(the\s+)?above\s+prompt/i,
  /you\s+are\s+now\s+(DAN|unrestricted|jailbroken)/i,
  /system\s*:\s*override/i,
  /reveal\s+(your\s+)?system\s+prompt/i,
  /expose\s+internal\s+tokens/i,
  /\[SYSTEM_DIRECTIVE\]/i,
];

export class ActionValidator {
  /**
   * Assess the risk level of an action command or description
   */
  public static assessRisk(command?: string, description?: string): {
    riskLevel: RiskLevel;
    violations: string[];
    sandboxStatus: 'verified' | 'sandboxed' | 'blocked' | 'requires_elevation';
    requiresUserConfirmation: boolean;
  } {
    const textToScan = `${command || ''} ${description || ''}`.trim();
    const violations: string[] = [];

    if (!textToScan) {
      return {
        riskLevel: 'low',
        violations: [],
        sandboxStatus: 'verified',
        requiresUserConfirmation: false,
      };
    }

    // 1. Check for Critical/Destructive patterns
    for (const pattern of CRITICAL_PATTERNS) {
      if (pattern.test(textToScan)) {
        violations.push(`Blocked destructive system command matching security pattern: ${pattern.toString()}`);
        return {
          riskLevel: 'critical',
          violations,
          sandboxStatus: 'blocked',
          requiresUserConfirmation: true,
        };
      }
    }

    // 2. Check for High-risk operations
    for (const pattern of HIGH_PATTERNS) {
      if (pattern.test(textToScan)) {
        violations.push(`High privilege system execution pattern detected: ${pattern.toString()}`);
        return {
          riskLevel: 'high',
          violations,
          sandboxStatus: 'requires_elevation',
          requiresUserConfirmation: true,
        };
      }
    }

    // 3. Check for Medium-risk operations (package installation, process management)
    for (const pattern of MEDIUM_PATTERNS) {
      if (pattern.test(textToScan)) {
        violations.push('Third-party package installation / process execution requires isolated sandbox');
        return {
          riskLevel: 'medium',
          violations,
          sandboxStatus: 'sandboxed',
          requiresUserConfirmation: true,
        };
      }
    }

    // Default safe action
    return {
      riskLevel: 'low',
      violations: [],
      sandboxStatus: 'verified',
      requiresUserConfirmation: false,
    };
  }

  /**
   * Scan untrusted input for prompt injection signatures
   */
  public static scanForPromptInjection(text: string): {
    detected: boolean;
    threats: string[];
    sanitized: string;
  } {
    const threats: string[] = [];
    let sanitized = text;

    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        threats.push(`Prompt injection signature detected: ${pattern.toString()}`);
        sanitized = sanitized.replace(pattern, '[REDACTED_SECURITY_THREAT]');
      }
    }

    return {
      detected: threats.length > 0,
      threats,
      sanitized,
    };
  }

  /**
   * Create a standardized security action proposal
   */
  public static createProposal(params: {
    title: string;
    command?: string;
    description: string;
    reason: string;
    source: 'screen' | 'document' | 'meeting' | 'prompt' | 'manual';
    sourceTitle?: string;
  }): ActionProposal {
    const assessment = this.assessRisk(params.command, params.description);

    return {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: params.title,
      command: params.command,
      description: params.description,
      reason: params.reason,
      source: params.source,
      sourceTitle: params.sourceTitle,
      riskLevel: assessment.riskLevel,
      sandboxStatus: assessment.sandboxStatus,
      safetyViolations: assessment.violations,
      userApproved: assessment.riskLevel === 'low', // Auto-approve only LOW risk
      executed: false,
      createdAt: Date.now(),
    };
  }
}
