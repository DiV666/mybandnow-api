import fs from 'node:fs';

import {
  type Logger,
  createStructuredLogEntry,
  safeStructuredLogStringify,
  sanitizeStructuredErrorForLogging
} from '@Contexts/Shared/application/index.js';

export interface RuntimeLogDestination {
  write: (chunk: string) => boolean;
}

export function createRuntimeFallbackLogger(
  destination: RuntimeLogDestination = createSynchronousStderrDestination()
): Logger {
  return new RuntimeStructuredFallbackLogger(destination);
}

export function sanitizeRuntimeErrorForLogging(error: unknown) {
  return sanitizeStructuredErrorForLogging(error);
}

export function sanitizeRuntimeErrorForTelemetry(error: unknown): Error {
  const sanitizedError = sanitizeStructuredErrorForLogging(error);
  const safeError = new Error(sanitizedError.code ?? sanitizedError.name);

  safeError.name = sanitizedError.name;
  safeError.stack = [sanitizedError.name, ...sanitizedError.stack].join('\n');

  if (sanitizedError.code) {
    const safeErrorWithCode = safeError as Error & { code?: string };
    safeErrorWithCode.code = sanitizedError.code;
  }

  return safeError;
}

class RuntimeStructuredFallbackLogger implements Logger {
  constructor(private readonly destination: RuntimeLogDestination) {}

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

  private write(level: 'error' | 'warn' | 'info' | 'debug', obj: unknown, ...args: string[]): void {
    this.destination.write(`${safeStructuredLogStringify(createStructuredLogEntry(level, obj, args))}\n`);
  }
}

function createSynchronousStderrDestination(
  processRef: Pick<NodeJS.Process, 'stderr'> = process
): RuntimeLogDestination {
  return {
    write: (chunk: string): boolean => {
      fs.writeSync(processRef.stderr.fd, chunk);
      return true;
    }
  };
}
