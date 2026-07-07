import { EventBus } from '../../../domain/EventBus.js';
import { Outbox } from '../../../domain/Outbox.js';
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          {
            eventId: outboxEvent.eventId,
            attempts: outboxEvent.attempts,
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
          },
          'Failed to publish outbox event'
        );

        if (outboxEvent.attempts + 1 >= this.maxRetries) {
          await this.outbox.markAsFailed(outboxEvent.id, errorMessage);
          this.logger.error({ eventId: outboxEvent.eventId }, 'Outbox event marked as failed after max retries');
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
}
