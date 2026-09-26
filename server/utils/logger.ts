/**
 * NEXUS AI - Production Logging Subsystem
 * Structured ISO logging with module tags, trace identifiers, and in-memory log buffer.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  meta?: any;
}

const MAX_LOG_BUFFER = 500;
const logBuffer: LogEntry[] = [];

export class Logger {
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      meta,
    };

    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOG_BUFFER) {
      logBuffer.shift();
    }

    const color = {
      DEBUG: '\x1b[90m',
      INFO: '\x1b[36m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
    }[level];
    const reset = '\x1b[0m';

    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`${color}[${entry.timestamp}] [${entry.level}] [${this.module}]${reset} ${message}${metaStr}`);
  }

  public debug(message: string, meta?: any): void {
    this.log('DEBUG', message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log('INFO', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.log('WARN', message, meta);
  }

  public error(message: string, meta?: any): void {
    this.log('ERROR', message, meta);
  }

  public static getRecentLogs(limit: number = 100): LogEntry[] {
    return logBuffer.slice(-limit).reverse();
  }

  public static clearLogs(): void {
    logBuffer.length = 0;
  }
}
