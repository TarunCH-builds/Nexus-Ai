/**
 * NEXUS AI - Structured Logging Subsystem
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: Record<string, any>;
  traceId?: string;
}

class NexusLogger {
  private inMemoryLogs: LogEntry[] = [];
  private readonly maxInMemoryLogs = 200;

  private format(level: LogLevel, module: string, message: string, details?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details,
    };
  }

  private push(entry: LogEntry) {
    this.inMemoryLogs.push(entry);
    if (this.inMemoryLogs.length > this.maxInMemoryLogs) {
      this.inMemoryLogs.shift();
    }

    const color = entry.level === 'ERROR' ? '\x1b[31m' : entry.level === 'WARN' ? '\x1b[33m' : '\x1b[36m';
    const reset = '\x1b[0m';
    console.log(`${color}[${entry.timestamp}] [${entry.level}] [${entry.module}]${reset} ${entry.message}`);
    if (entry.details && Object.keys(entry.details).length > 0) {
      console.log('  ', JSON.stringify(entry.details));
    }
  }

  debug(module: string, message: string, details?: Record<string, any>) {
    this.push(this.format('DEBUG', module, message, details));
  }

  info(module: string, message: string, details?: Record<string, any>) {
    this.push(this.format('INFO', module, message, details));
  }

  warn(module: string, message: string, details?: Record<string, any>) {
    this.push(this.format('WARN', module, message, details));
  }

  error(module: string, message: string, details?: Record<string, any>) {
    this.push(this.format('ERROR', module, message, details));
  }

  getRecentLogs(limit = 50): LogEntry[] {
    return this.inMemoryLogs.slice(-limit);
  }
}

export const logger = new NexusLogger();
