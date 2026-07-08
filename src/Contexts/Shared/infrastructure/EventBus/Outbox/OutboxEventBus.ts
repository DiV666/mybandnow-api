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

    // Step 1: ALWAYS save to outbox first (guaranteed persistence within the current transaction)
    const outboxIds = await this.outbox.save(events);

    // Step 2: Try to publish immediately to RabbitMQ (best-effort, deferred)
    // We do this asynchronously without awaiting it here, so that if this is called
    // inside a database transaction, we don't hold the transaction open during network I/O.
    // The Promise is fire-and-forget.
    setImmediate(async () => {
      try {
        await this.innerBus.publish(events);
        
        // Step 3: Mark as published so the OutboxPublisher poller does not redeliver them
        await this.outbox.markAsPublished(outboxIds);
      } catch (error) {
        // If publish fails, events are already in outbox → OutboxPublisher will retry
        this.logger.warn(
          { errorType: error instanceof Error ? error.constructor.name : 'UnknownError', eventCount: events.length },
          'Immediate publish failed or could not mark as published; poller will redeliver'
        );
      }
    });
  }
}

