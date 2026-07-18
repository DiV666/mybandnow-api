import { DomainEvent } from '../../../domain/DomainEvent.js';
import { EventBus } from '../../../domain/EventBus.js';
import { Outbox, OutboxEvent } from '../../../domain/Outbox.js';
import Logger from '../../../domain/Logger.js';
import { DomainEventJsonDeserializer } from '../DomainEventJsonDeserializer.js';

/**
 * Background process that polls the outbox table and publishes pending events.
 * Runs independently from the main EventBus publish flow.
 */
export class OutboxPublisher {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private isProcessing = false;
  private inFlightRun?: Promise<void>;

  constructor(
    private outbox: Outbox,
    private eventBus: EventBus,
    private deserializer: DomainEventJsonDeserializer,
    private logger: Logger,
    private pollIntervalMs: number = 5000,
    private batchSize: number = 100,
    private maxRetries: number = 3
  ) {}

  start(): void {
    if (this.isRunning) {
      this.logger.warn('OutboxPublisher already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('OutboxPublisher started');

    this.intervalId = setInterval(() => {
      this.runTick();
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    if (this.inFlightRun) {
      await this.inFlightRun;
    }
    this.logger.info('OutboxPublisher stopped');
  }

  private runTick(): void {
    // Skip this tick while a previous batch is still in flight to avoid duplicate publishes
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.inFlightRun = this.processOutbox()
      .catch((error) => {
        this.logger.error(
          { errorType: error instanceof Error ? error.constructor.name : 'UnknownError' },
          'OutboxPublisher tick failed'
        );
      })
      .finally(() => {
        this.isProcessing = false;
        this.inFlightRun = undefined;
      });
  }

  private async processOutbox(): Promise<void> {
    const pending = await this.outbox.pending(this.batchSize);
    if (pending.length === 0) return;

    this.logger.info({ count: pending.length }, 'Processing outbox events');

    const published: string[] = [];

    for (const outboxEvent of pending) {
      try {
        const event = this.deserializer.deserialize(outboxEvent.payload);
        await this.eventBus.publish([event]);
        published.push(outboxEvent.id);
        this.logger.debug(this.logContext(outboxEvent, event), 'domain_event.publish.outbox_poller.succeeded');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          {
            ...this.logContext(outboxEvent),
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
          },
          'domain_event.publish.outbox_poller.failed'
        );

        if (outboxEvent.attempts + 1 >= this.maxRetries) {
          await this.outbox.markAsFailed(outboxEvent.id, errorMessage);
          this.logger.error(this.logContext(outboxEvent), 'domain_event.publish.outbox_poller.marked_failed');
        } else {
          await this.outbox.incrementAttempts(outboxEvent.id, errorMessage);
        }
      }
    }

    if (published.length > 0) {
      await this.outbox.markAsPublished(published);
      this.logger.info({ count: published.length }, 'Outbox events published successfully');
    }
  }

  private logContext(outboxEvent: OutboxEvent, event?: DomainEvent): Record<string, string | number> {
    const context: Record<string, string | number> = {
      aggregateId: event?.aggregateId ?? outboxEvent.aggregateId,
      attempts: outboxEvent.attempts,
      eventCount: 1,
      eventId: event?.eventId ?? outboxEvent.eventId,
      eventName: event?.eventName ?? outboxEvent.eventName,
      outboxId: outboxEvent.id,
      source: 'outbox-poller'
    };
    const correlationId = event ? this.extractCorrelationId(event.meta) : undefined;

    if (correlationId) {
      context.correlationId = correlationId;
    }

    return context;
  }

  private extractCorrelationId(meta: Record<string, unknown>): string | undefined {
    const correlationId = meta['x-correlation-id'];

    return typeof correlationId === 'string' ? correlationId : undefined;
  }
}
