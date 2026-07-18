import { DomainEvent } from '../../../domain/DomainEvent.js';
import { EventBus } from '../../../domain/EventBus.js';
import { Outbox } from '../../../domain/Outbox.js';
import Logger from '../../../domain/Logger.js';

/**
 * Outbox Pattern implementation.
 * Saves all events to the outbox table FIRST (guaranteed persistence),
 * then attempts to publish to RabbitMQ.
 * A separate OutboxPublisher process retries pending events.
 */
const OUTBOX_IDS_META_KEY = 'outboxIds';

export class OutboxEventBus implements EventBus {
  constructor(
    private outbox: Outbox,
    private innerBus: EventBus,
    private logger: Logger
  ) {}

  async start(): Promise<void> {
    await this.innerBus.start();
  }

  async stop(): Promise<void> {
    await this.innerBus.stop();
  }
  async publish(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const outboxIds = this.resolveOutboxIds(events) ?? (await this.outbox.save(events));

    // Step 2: Try to publish immediately to RabbitMQ (best-effort, deferred)
    // We do this asynchronously without awaiting it here, so that if this is called
    // inside a database transaction, we don't hold the transaction open during network I/O.
    // The Promise is fire-and-forget.
    setImmediate(async () => {
      try {
        await this.innerBus.publish(events);

        // Step 3: Mark as published so the OutboxPublisher poller does not redeliver them
        await this.outbox.markAsPublished(outboxIds);

        events.forEach((event, index) => {
          this.logger.debug(
            this.logContext(event, events.length, outboxIds[index], 'immediate-publish'),
            'domain_event.publish.immediate.succeeded'
          );
        });
      } catch (error) {
        const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';

        events.forEach((event, index) => {
          this.logger.warn(
            {
              ...this.logContext(event, events.length, outboxIds[index], 'immediate-publish'),
              errorType
            },
            'domain_event.publish.immediate.failed'
          );
        });
      }
    });
  }

  private resolveOutboxIds(events: DomainEvent[]): string[] | undefined {
    const outboxIds = events.flatMap((event) => {
      const persistedOutboxIds = event.meta[OUTBOX_IDS_META_KEY];

      return Array.isArray(persistedOutboxIds)
        ? persistedOutboxIds.filter((outboxId): outboxId is string => typeof outboxId === 'string')
        : [];
    });

    return outboxIds.length === events.length ? outboxIds : undefined;
  }

  private logContext(
    event: DomainEvent,
    eventCount: number,
    outboxId: string | undefined,
    source: 'immediate-publish'
  ): Record<string, string | number> {
    const context: Record<string, string | number> = {
      aggregateId: event.aggregateId,
      eventCount,
      eventId: event.eventId,
      eventName: event.eventName,
      source
    };
    const correlationId = this.extractCorrelationId(event);

    if (correlationId) {
      context.correlationId = correlationId;
    }

    if (outboxId) {
      context.outboxId = outboxId;
    }

    return context;
  }

  private extractCorrelationId(event: DomainEvent): string | undefined {
    const correlationId = event.meta['x-correlation-id'];

    return typeof correlationId === 'string' ? correlationId : undefined;
  }
}
