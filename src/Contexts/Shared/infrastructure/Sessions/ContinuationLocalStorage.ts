/**
 * Continuation-local storage using native Node.js AsyncLocalStorage.
 * Replaces cls-hooked to fix async context lifecycle bugs in RabbitMQ consumers
 * and other async flows.
 *
 * Key differences from cls-hooked:
 * - AsyncLocalStorage.run() callback can be async — context survives await
 * - No bindEmitter() needed — context propagates automatically through async chains
 * - No AssertionError crashes when context exits before async work completes
 *
 * https://nodejs.org/api/async_context.html#class-asynclocalstorage
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { Nullable } from '../../domain/Nullable.js';

/**
 * Context object stored per async execution chain
 */
export interface Context {
  correlationId: string;
  requestTime: number;
}

export default class ContinuationLocalStorage {
  private static storage = new AsyncLocalStorage<Context>();

  /**
   * Run a callback with a new async context.
   * The context is available to all async operations within the callback chain.
   */
  public static run<T>(context: Context, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  /**
   * Get the current context from the async execution chain.
   * Returns null if called outside of a ContinuationLocalStorage.run() scope.
   */
  public static getContext(): Nullable<Context> {
    return this.storage.getStore() ?? null;
  }

  /**
   * Legacy method for backward compatibility with cls-hooked code.
   * Returns a mock namespace object to minimize diff during migration.
   * @deprecated Use ContinuationLocalStorage.run() directly instead.
   */
  public static createNamespace() {
    return {
      run: <T>(callback: () => T): T => {
        // cls-hooked allowed synchronous callbacks with floating promises — NOT safe.
        // If callback is async, caller MUST await this.
        return callback();
      },
      // bindEmitter no longer needed — AsyncLocalStorage propagates automatically
      bindEmitter: () => {
        // no-op for backward compatibility
      },
      set: () => {
        // no-op — use ContinuationLocalStorage.run() to set context instead
      },
      get: (): Nullable<Context> => {
        return this.getContext();
      }
    };
  }
}
