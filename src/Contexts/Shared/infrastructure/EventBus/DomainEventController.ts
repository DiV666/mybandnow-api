import { CommandBus } from '../../domain/CommandBus.js';
import { Exception } from '../../domain/Exception.js';
import { NonRetryableException } from '../../domain/exceptions/NonRetryableException.js';
import Logger from '../../domain/Logger.js';

export class DomainEventController {
  constructor(
    readonly module: string,
    readonly logger: Logger,
    readonly commandBus: CommandBus
  ) {}

  handlerException(exception: unknown): void {
    if (typeof exception !== 'object' || exception === null) {
      this.logger.error(String(exception), 'Non-object exception:');
      throw exception;
    }

    const exceptionClassName = exception.constructor.name;

    if (exception instanceof Exception) {
      if (this.nonRetryableExceptions().includes(exceptionClassName)) {
        // Known, non-recoverable error: log as warning and route to dead-letter (no retry).
        this.logger.warn({ code: exception.code }, `${exceptionClassName} (non-retryable):`);
        throw new NonRetryableException(exception);
      }

      // Do not log exception.toJSON() — may contain PII in attributes.
      // Only log the exception code (safe, domain-defined constant).
      this.logger.error({ code: exception.code }, `${exceptionClassName}:`);
      throw exception;
    }

    // Do not log error.message — may contain dynamic PII.
    // Only log the exception type (safe, class name).
    this.logger.error({ type: exceptionClassName }, `${exceptionClassName}:`);
    throw exception;
  }

  /**
   * Returns the list of Exception subclass names that are non-retryable.
   * When one of these is thrown during `on()`, the message is sent directly
   * to the dead-letter queue instead of being retried.
   *
   * Override in subclasses to declare known, non-recoverable exceptions.
   * Example: return ['InvalidArgumentException', 'UserNotFoundException'];
   */
  nonRetryableExceptions(): Array<string> {
    return [];
  }
}
