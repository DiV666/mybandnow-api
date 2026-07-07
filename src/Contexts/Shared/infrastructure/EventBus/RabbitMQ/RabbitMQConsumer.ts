import { ConsumeMessage } from 'amqplib';
import { DomainEvent } from '../../../domain/DomainEvent.js';
import { NonRetryableException } from '../../../domain/exceptions/NonRetryableException.js';
import { DomainEventSubscriber } from '../DomainEventSubscriber.js';
import { RabbitMQConnection } from './RabbitMQConnection.js';
import ContinuationLocalStorage from '../../Sessions/ContinuationLocalStorage.js';
import { UuidValueObject } from '../../../domain/value-object/UuidValueObject.js';
import Logger from '../../../domain/Logger.js';
import { Clock } from '../../../domain/Clock.js';

type RabbitMQMessageLogContext = {
  readonly queueName: string;
  readonly subscriberName: string;
  readonly eventName?: string;
  readonly routingKey: string;
  readonly aggregateId?: string;
  readonly correlationId: string;
  readonly redeliveryCount: number;
};

type RabbitMQRawEvent = {
  readonly eventName?: unknown;
  readonly aggregateId?: unknown;
  readonly meta?: Record<string, unknown>;
};

type RabbitMQDomainEventPrimitives = {
  readonly eventName: string;
  readonly aggregateId: string;
  readonly eventId: string;
  readonly occurredOn: string;
  readonly attributes: Record<string, unknown>;
  readonly meta?: Record<string, unknown>;
};

class DeserializedRabbitMQDomainEvent extends DomainEvent {
  constructor(params: RabbitMQDomainEventPrimitives) {
    super({
      eventName: params.eventName,
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: new Date(params.occurredOn),
      meta: params.meta
    });

    this.attributes = params.attributes;
  }
}

export class RabbitMQConsumer {
  private readonly logger: Logger;
  private readonly subscriber: DomainEventSubscriber;
  private readonly connection: RabbitMQConnection;
  private readonly maxRetries: number;
  private readonly queueName: string;
  private readonly exchange: string;
  private readonly clock: Clock;

  constructor(params: {
    logger: Logger;
    subscriber: DomainEventSubscriber;
    connection: RabbitMQConnection;
    queueName: string;
    exchange: string;
    maxRetries: number;
    clock: Clock;
  }) {
    this.logger = params.logger;
    this.subscriber = params.subscriber;
    this.connection = params.connection;
    this.maxRetries = params.maxRetries;
    this.queueName = params.queueName;
    this.exchange = params.exchange;
    this.clock = params.clock;
  }

  async onMessage(message: ConsumeMessage): Promise<void> {
    // Parse the message content ONCE and reuse the result for logging and deserialization
    const { parsed, parseError } = this.parseMessageContent(message);
    const rawEvent = this.extractRawEvent(parsed);
    const logContext = this.buildLogContext(message, rawEvent);

    // AsyncLocalStorage.run() with async callback — context survives the entire chain
    // CRITICAL FIX: cls-hooked would exit context before async work completed, causing crashes
    await ContinuationLocalStorage.run(
      {
        correlationId: logContext.correlationId,
        requestTime: this.clock.nowTimestamp()
      },
      async () => {
        try {
          if (parseError !== undefined) {
            throw parseError;
          }

          const domainEvent = this.deserializeDomainEvent(parsed);

          this.logger.info(
            logContext,
            `Message received from queue <${this.queueName}> and consumed by <${logContext.subscriberName}>`
          );

          await this.subscriber.on(domainEvent).catch((ex) => {
            this.subscriber.handlerException(ex);
            throw ex; // Re-throw to trigger retry logic in outer catch
          });

          const duration = this.calculateDuration();
          const successLogContext = duration === undefined ? logContext : { ...logContext, duration };

          this.logger.info(
            successLogContext,
            `Message consumed successfully from queue <${this.queueName}> by <${logContext.subscriberName}>`
          );

          this.connection.ack(message);
        } catch (error) {
          await this.handleMessageError(message, error, logContext);
        }
      }
    );
  }

  private parseMessageContent(message: ConsumeMessage): { parsed?: unknown; parseError?: unknown } {
    try {
      return { parsed: JSON.parse(message.content.toString()) };
    } catch (error) {
      return { parseError: error };
    }
  }

  private extractCorrelationId(rawEvent: RabbitMQRawEvent | undefined): string {
    const rawCorrelationId = rawEvent?.meta?.['x-correlation-id'];

    return typeof rawCorrelationId === 'string' ? rawCorrelationId : UuidValueObject.random();
  }

  private extractRawEvent(parsed: unknown): RabbitMQRawEvent | undefined {
    if (!this.isRecord(parsed) || !('data' in parsed) || !this.isRecord(parsed.data)) {
      return undefined;
    }

    return {
      eventName: parsed.data.eventName,
      aggregateId: parsed.data.aggregateId,
      meta: this.isRecord(parsed.data.meta) ? parsed.data.meta : undefined
    };
  }

  private buildLogContext(message: ConsumeMessage, rawEvent: RabbitMQRawEvent | undefined): RabbitMQMessageLogContext {
    return {
      queueName: this.queueName,
      subscriberName: this.subscriberName(),
      eventName: typeof rawEvent?.eventName === 'string' ? rawEvent.eventName : undefined,
      routingKey: message.fields.routingKey,
      aggregateId: typeof rawEvent?.aggregateId === 'string' ? rawEvent.aggregateId : undefined,
      correlationId: this.extractCorrelationId(rawEvent),
      redeliveryCount: this.redeliveryCount(message)
    };
  }

  private subscriberName(): string {
    const namedSubscriber = this.subscriber as DomainEventSubscriber & { name?: () => string };

    if (typeof namedSubscriber.name === 'function') {
      return namedSubscriber.name();
    }

    return this.subscriber.constructor.name;
  }

  private redeliveryCount(message: ConsumeMessage): number {
    const headers = message.properties.headers || {};
    const rawCount = headers['redelivery_count'];

    if (rawCount === undefined) {
      return 0;
    }

    const parsedCount = Number.parseInt(rawCount.toString(), 10);
    return Number.isNaN(parsedCount) ? 0 : parsedCount;
  }

  private calculateDuration(): number | undefined {
    const context = ContinuationLocalStorage.getContext();

    if (!context) {
      return undefined;
    }

    return this.clock.nowTimestamp() - context.requestTime;
  }

  private deserializeDomainEvent(payload: unknown): DomainEvent {
    if (!this.isRecord(payload) || !('data' in payload)) {
      throw new TypeError('Invalid DomainEvent structure: missing required fields');
    }

    return new DeserializedRabbitMQDomainEvent(this.extractDomainEventPrimitives(payload.data));
  }

  private extractDomainEventPrimitives(rawEvent: unknown): RabbitMQDomainEventPrimitives {
    if (!this.isRecord(rawEvent)) {
      throw new TypeError('Invalid DomainEvent structure: missing required fields');
    }

    const eventName = this.readRequiredString(rawEvent.eventName);
    const aggregateId = this.readRequiredString(rawEvent.aggregateId);
    const eventId = this.readRequiredString(rawEvent.eventId);
    const occurredOn = this.readRequiredString(rawEvent.occurredOn);
    const attributes = this.readRequiredRecord(rawEvent.attributes);
    const meta = this.readMeta(rawEvent.meta);

    if (Number.isNaN(new Date(occurredOn).getTime())) {
      throw new TypeError('Invalid DomainEvent structure: occurredOn must be a valid date');
    }

    return {
      eventName,
      aggregateId,
      eventId,
      occurredOn,
      attributes,
      meta
    };
  }

  private async handleMessageError(
    message: ConsumeMessage,
    error: unknown,
    logContext: RabbitMQMessageLogContext
  ): Promise<void> {
    // Single boundary failure log — do not log error.message, it may contain PII from message content
    this.logger.error(
      {
        ...logContext,
        errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
      },
      `Message consumption failed from queue <${this.queueName}> by <${logContext.subscriberName}>`
    );

    // Non-retryable: known, deterministic failure — skip retry and go straight to dead-letter.
    if (error instanceof NonRetryableException) {
      this.logger.warn(
        { errorType: error.originalException.constructor.name, code: error.code },
        'RabbitMQConsumer.onMessage: non-retryable exception — routing to dead-letter'
      );
      try {
        await this.deadLetter(message);
        this.connection.ack(message);
      } catch (dlErr) {
        this.logger.error(
          { errorType: dlErr instanceof Error ? dlErr.constructor.name : 'UnknownError' },
          'RabbitMQConsumer.deadLetter failed — nacking for redelivery'
        );
        this.connection.nack(message, false, true);
      }
      return;
    }

    try {
      await this.handleError(message);
    } catch (handleErr) {
      this.logger.error(
        { errorType: handleErr instanceof Error ? handleErr.constructor.name : 'UnknownError' },
        'RabbitMQConsumer.handleError failed — nacking for redelivery'
      );
      this.connection.nack(message, false, true);
    }
  }

  private async handleError(message: ConsumeMessage) {
    if (this.hasBeenRedeliveredTooMuch(message)) {
      await this.deadLetter(message);
      this.connection.ack(message);
    } else {
      await this.retry(message);
      this.connection.ack(message);
    }
  }

  private async retry(message: ConsumeMessage) {
    await this.connection.retry(message, this.queueName, this.exchange);
  }

  private async deadLetter(message: ConsumeMessage) {
    await this.connection.deadLetter(message, this.queueName, this.exchange);
  }

  private hasBeenRedeliveredTooMuch(message: ConsumeMessage): boolean {
    const headers = message.properties.headers || {};
    if (this.hasBeenRedelivered(message, headers)) {
      const count = parseInt(headers['redelivery_count'].toString());
      return count >= this.maxRetries;
    }
    return false;
  }

  private hasBeenRedelivered(message: ConsumeMessage, currentHeaders?: Record<string, unknown>): boolean {
    const headersToCheck = currentHeaders || message.properties.headers;
    return headersToCheck?.['redelivery_count'] !== undefined;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readRequiredString(value: unknown): string {
    if (typeof value !== 'string') {
      throw new TypeError('Invalid DomainEvent structure: missing required fields');
    }

    return value;
  }

  private readRequiredRecord(value: unknown): Record<string, unknown> {
    if (!this.isRecord(value)) {
      throw new TypeError('Invalid DomainEvent structure: missing required fields');
    }

    return value;
  }

  private readMeta(value: unknown): Record<string, unknown> {
    if (value === undefined) {
      return {};
    }

    return this.readRequiredRecord(value);
  }
}
