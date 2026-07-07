import { describe, it, expect, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { DomainEventController } from '../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventController.js';
import { NonRetryableException } from '../../../../../../src/Contexts/Shared/domain/exceptions/NonRetryableException.js';
import Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('DomainEventController', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
  });

  describe('#handlerException — domain exceptions (Exception subclasses)', () => {
    it('rethrows Exception subclasses NOT listed in nonRetryableExceptions()', () => {
      const controller = new DomainEventController('test-module', logger, commandBus);
      const exception = new InvalidArgumentException({ message: 'bad input' });

      expect(() => controller.handlerException(exception)).toThrow(InvalidArgumentException);
      expect(logger.error).toHaveBeenCalledWith({ code: exception.code }, 'InvalidArgumentException:');
    });
  });

  describe('#handlerException — non-retryable exceptions', () => {
    class StrictController extends DomainEventController {
      override nonRetryableExceptions(): string[] {
        return ['InvalidArgumentException'];
      }
    }

    it('throws NonRetryableException for exceptions listed in nonRetryableExceptions()', () => {
      const controller = new StrictController('test-module', logger, commandBus);
      const exception = new InvalidArgumentException({ message: 'bad data' });

      expect(() => controller.handlerException(exception)).toThrow(NonRetryableException);
    });

    it('logs a warning (not error) for non-retryable exceptions', () => {
      const controller = new StrictController('test-module', logger, commandBus);
      const exception = new InvalidArgumentException({ code: 'INVALID', message: 'bad data' });

      expect(() => controller.handlerException(exception)).toThrow();
      expect(logger.warn).toHaveBeenCalledWith({ code: exception.code }, 'InvalidArgumentException (non-retryable):');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('wraps the original exception inside NonRetryableException', () => {
      const controller = new StrictController('test-module', logger, commandBus);
      const original = new InvalidArgumentException({ message: 'bad data' });

      try {
        controller.handlerException(original);
      } catch (ex) {
        expect(ex).toBeInstanceOf(NonRetryableException);
        expect((ex as NonRetryableException).originalException).toBe(original);
      }
    });
  });

  describe('#handlerException — non-domain exceptions', () => {
    it('logs only exception type (sanitized, no message)', () => {
      const controller = new DomainEventController('test-module', logger, commandBus);
      const error = new Error('unexpected');

      expect(() => controller.handlerException(error)).toThrow(error);
      expect(logger.error).toHaveBeenCalledWith({ type: 'Error' }, 'Error:');
    });

    it('always rethrows non-Exception errors', () => {
      const controller = new DomainEventController('test-module', logger, commandBus);
      const error = new TypeError('type mismatch');
      expect(() => controller.handlerException(error)).toThrow(TypeError);
    });
  });

  describe('#handlerException — non-object exceptions', () => {
    it('logs the stringified value and rethrows the original exception unchanged', () => {
      const controller = new DomainEventController('test-module', logger, commandBus);
      const exception = 'raw-thrown-string';

      expect(() => controller.handlerException(exception)).toThrow();
      expect(logger.error).toHaveBeenCalledWith(String(exception), 'Non-object exception:');
    });

    it('rethrows null as-is', () => {
      const controller = new DomainEventController('test-module', logger, commandBus);

      try {
        controller.handlerException(null);
        expect.unreachable('handlerException should have thrown');
      } catch (ex) {
        expect(ex).toBeNull();
      }
      expect(logger.error).toHaveBeenCalledWith('null', 'Non-object exception:');
    });
  });

  describe('#nonRetryableExceptions', () => {
    it('returns an empty array by default', () => {
      const controller = new DomainEventController('test-module', logger, commandBus);
      expect(controller.nonRetryableExceptions()).toEqual([]);
    });
  });
});
