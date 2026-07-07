import fs from 'node:fs';

import type Logger from '../../domain/Logger.js';
import {
  createStructuredLogEntry,
  type SanitizedErrorPayload,
  sanitizeStructuredErrorForLogging,
  safeStructuredLogStringify,
  type StructuredLogLevel
} from '../../domain/StructuredLogging.js';

export interface StructuredLogDestination {
  write: (chunk: string) => boolean;
}

export default class StructuredFallbackLogger implements Logger {
  constructor(private readonly destination: StructuredLogDestination = createSynchronousStderrDestination()) {}

  error(obj: unknown, ...args: string[]): void {
    this.write('error', obj, ...args);
  }

  warn(obj: unknown, ...args: string[]): void {
    this.write('warn', obj, ...args);
  }

  info(obj: unknown, ...args: string[]): void {
    this.write('info', obj, ...args);
  }

  debug(obj: unknown, ...args: string[]): void {
    this.write('debug', obj, ...args);
  }

  private write(level: StructuredLogLevel, obj: unknown, ...args: string[]): void {
    this.destination.write(`${safeStructuredLogStringify(createStructuredLogEntry(level, obj, args))}\n`);
  }
}

export function createSynchronousStderrDestination(
  processRef: Pick<NodeJS.Process, 'stderr'> = process
): StructuredLogDestination {
  return {
    write: (chunk: string): boolean => {
      fs.writeSync(processRef.stderr.fd, chunk);
      return true;
    }
  };
}

export function sanitizeErrorForLogging(error: unknown): SanitizedErrorPayload {
  return sanitizeStructuredErrorForLogging(error);
}
