import {
  createSensitiveFieldsPolicy,
  sanitizeStringForLogging,
  sanitizeValueForLogging
} from './LoggingRedactionPolicy.js';

const SENSITIVE_FIELDS_DEFAULT = createSensitiveFieldsPolicy();

export type StructuredLogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface SanitizedErrorPayload {
  code?: string;
  details?: unknown;
  name: string;
  stack: string[];
}

export interface StructuredLogEntry {
  context?: Record<string, unknown>;
  level: StructuredLogLevel;
  msg: string;
  time: string;
}

export function createStructuredLogEntry(level: StructuredLogLevel, obj: unknown, args: string[]): StructuredLogEntry {
  const entry: StructuredLogEntry = {
    level,
    msg: resolveMessage(obj, args),
    time: new Date().toISOString()
  };

  const context = resolveContext(obj, args);
  if (context) {
    entry.context = context;
  }

  return entry;
}

export function sanitizeStructuredErrorForLogging(error: unknown): SanitizedErrorPayload {
  if (!(error instanceof Error)) {
    const details = sanitizeForStructuredLogging(error);

    return {
      details,
      name: 'NonErrorThrowable',
      stack: []
    };
  }

  const record = error as Error & { code?: unknown };
  const sanitizedError: SanitizedErrorPayload = {
    name: error.name || error.constructor.name || 'Error',
    stack: sanitizeStack(error.stack)
  };

  if (typeof record.code === 'string' && record.code.length > 0) {
    sanitizedError.code = record.code;
  }

  return sanitizedError;
}

export function sanitizeForStructuredLogging(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return sanitizeStructuredErrorForLogging(value);
  }

  return sanitizeValueForLogging(value, SENSITIVE_FIELDS_DEFAULT, depth, seen, sanitizeStructuredErrorForLogging);
}

export function safeStructuredLogStringify(value: StructuredLogEntry): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    const serializationError = error instanceof Error ? error.message : 'Unknown serialization error';

    return JSON.stringify({
      context: {
        serializationError
      },
      level: 'error',
      msg: 'Structured fallback log serialization failed',
      time: new Date().toISOString()
    } satisfies StructuredLogEntry);
  }
}

function resolveMessage(obj: unknown, args: string[]): string {
  if (args.length > 0) {
    return sanitizeStringForLogging(args[0] ?? 'Structured fallback log');
  }

  if (obj instanceof Error) {
    return obj.name;
  }

  return typeof obj === 'string' ? sanitizeStringForLogging(obj) : 'Structured fallback log';
}

function resolveContext(obj: unknown, args: string[]): Record<string, unknown> | undefined {
  if (obj instanceof Error) {
    return { error: sanitizeStructuredErrorForLogging(obj) };
  }

  if (obj !== null && typeof obj === 'object') {
    return sanitizeForStructuredLogging(obj) as Record<string, unknown>;
  }

  if (args.length === 0 && obj !== undefined) {
    return { value: sanitizeStringForLogging(formatPrimitiveLogValue(obj)) };
  }

  return undefined;
}

function formatPrimitiveLogValue(value: unknown): string {
  if (value === undefined) {
    return '[Undefined]';
  }

  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'bigint' ||
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'symbol'
  ) {
    return value.toString();
  }

  if (typeof value === 'function') {
    return `[Function:${value.name || 'anonymous'}]`;
  }

  return '[UnsupportedValue]';
}

function sanitizeStack(stack?: string): string[] {
  if (!stack) {
    return [];
  }

  return stack
    .split('\n')
    .slice(1)
    .map((line) => sanitizeStringForLogging(line.trim()))
    .filter((line) => line.length > 0);
}
