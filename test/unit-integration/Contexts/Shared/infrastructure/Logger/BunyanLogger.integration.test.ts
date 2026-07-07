import { describe, it, expect } from 'vitest';
import BunyanLogger from '../../../../../../src/Contexts/Shared/infrastructure/Logger/BunyanLogger.js';

describe('BunyanLogger should', () => {
  const bunyanLogger = new BunyanLogger({ level: 'debug', types: ['console'] });

  it('logs a debug message', () => {
    expect(() => bunyanLogger.debug('debug message')).not.toThrow();
  });

  it('logs an error message', () => {
    expect(() => bunyanLogger.error('error message')).not.toThrow();
  });

  it('logs an info message', () => {
    expect(() => bunyanLogger.info('info message')).not.toThrow();
  });

  it('logs an warn message', () => {
    expect(() => bunyanLogger.warn('warn message')).not.toThrow();
  });
});
