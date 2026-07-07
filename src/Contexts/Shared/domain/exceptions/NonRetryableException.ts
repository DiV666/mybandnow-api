import { Exception } from '../Exception.js';

/**
 * Signals that an event handler encountered a known, non-recoverable error.
 * The RabbitMQ consumer routes messages that trigger this exception directly
 * to the dead-letter queue — no retry attempts are made.
 *
 * Throw this (or let DomainEventController throw it) when the failure is
 * deterministic: retrying will always produce the same result.
 */
export class NonRetryableException extends Exception {
  readonly originalException: Exception;

  constructor(originalException: Exception) {
    super({
      code: originalException.code,
      message: originalException.message,
      details: originalException.details
    });
    this.originalException = originalException;
  }
}
