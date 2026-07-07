import { describe, it, expect } from 'vitest';
import ContinuationLocalStorage from '../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';

describe('ContinuationLocalStorage', () => {
  describe('run/getContext', () => {
    it('should expose the given context to code running inside the callback', () => {
      // Arrange
      const context = { correlationId: 'corr-1', requestTime: Date.now() };

      // Act
      const result = ContinuationLocalStorage.run(context, () => ContinuationLocalStorage.getContext());

      // Assert
      expect(result).toEqual(context);
    });

    it('should return null when called outside of a run() scope', () => {
      // Act
      const result = ContinuationLocalStorage.getContext();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('createNamespace (legacy compatibility)', () => {
    /* eslint-disable sonarjs/deprecation -- exercising the deprecated legacy API on purpose */
    it('should run a synchronous callback and return its value', () => {
      // Arrange
      const namespace = ContinuationLocalStorage.createNamespace();

      // Act
      const result = namespace.run(() => 'callback-result');

      // Assert
      expect(result).toBe('callback-result');
    });

    it('should expose the outer context through get() while running inside run()', () => {
      // Arrange
      const context = { correlationId: 'corr-2', requestTime: Date.now() };
      const namespace = ContinuationLocalStorage.createNamespace();

      // Act
      const result = ContinuationLocalStorage.run(context, () => namespace.get());

      // Assert
      expect(result).toEqual(context);
    });

    it('should return null from get() outside of any active context', () => {
      // Arrange
      const namespace = ContinuationLocalStorage.createNamespace();

      // Act
      const result = namespace.get();

      // Assert
      expect(result).toBeNull();
    });

    it('should be a no-op for bindEmitter()', () => {
      // Arrange
      const namespace = ContinuationLocalStorage.createNamespace();

      // Act & Assert
      expect(() => namespace.bindEmitter()).not.toThrow();
    });

    it('should be a no-op for set()', () => {
      // Arrange
      const namespace = ContinuationLocalStorage.createNamespace();

      // Act & Assert
      expect(() => namespace.set()).not.toThrow();
    });
    /* eslint-enable sonarjs/deprecation */
  });
});
