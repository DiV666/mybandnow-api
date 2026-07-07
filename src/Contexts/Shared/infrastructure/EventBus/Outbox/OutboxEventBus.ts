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

    // Step 1: ALWAYS save to outbox first (guaranteed persistence)
    const outboxIds = await this.outbox.save(events);

    // Step 2: Try to publish immediately to RabbitMQ (best-effort)
    try {
      await this.innerBus.publish(events);
    } catch (error) {
      // If publish fails, events are already in outbox → OutboxPublisher will retry
      this.logger.warn(
        { errorType: error instanceof Error ? error.constructor.name : 'UnknownError', eventCount: events.length },
        'Immediate publish failed, events saved to outbox for retry'
      );
      return;
    }

    // Step 3: Mark as published so the OutboxPublisher poller does not redeliver them
    try {
      await this.outbox.markAsPublished(outboxIds);
    } catch (error) {
      // Publish succeeded but the outbox row is still pending → poller will redeliver
      this.logger.warn(
        { errorType: error instanceof Error ? error.constructor.name : 'UnknownError', eventCount: events.length },
        'Event published but could not be marked as published in outbox; poller will redeliver'
      );
    }
  }
}
