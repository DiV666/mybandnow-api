import EventEmitter from 'events';
import { DomainEvent } from '../../../domain/DomainEvent.js';
import { EventBus } from '../../../domain/EventBus.js';
import { DomainEventSubscribers } from '../DomainEventSubscribers.js';
import StructuredFallbackLogger from '../../Logger/StructuredFallbackLogger.js';
import { EventBusCorrelationIdMetaEnricher } from '../EventBusCorrelationIdMetaEnricher.js';

const fallbackLogger = new StructuredFallbackLogger();

export class InMemoryAsyncEventBus extends EventEmitter implements EventBus {
  constructor(private readonly subscribers: DomainEventSubscribers = new DomainEventSubscribers([])) {
    super({ captureRejections: true });
    this.on('error', (err: unknown) => {
      fallbackLogger.error(
        { errorType: err instanceof Error ? err.constructor.name : 'UnknownError' },
        'InMemoryAsyncEventBus unhandled error'
      );
    });
  }

  async start(): Promise<void> {
    await this.addSubscribers(this.subscribers);
  }

  async stop(): Promise<void> {
    this.removeAllListeners();
  }

  async addSubscribers(subscribers: DomainEventSubscribers): Promise<void> {
    for (const subscriber of subscribers.items) {
      for (const event of subscriber.subscribedTo()) {
        this.on(event, async (args: DomainEvent) => {
          await subscriber.on
            .bind(subscriber)(args)
            .catch((ex) => subscriber.handlerException(ex));
        });
      }
    }
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (let event of events) {
      event = this.setMetaCorrelationId(event);
      this.emit(event.eventName, event);
    }
  }

  private setMetaCorrelationId(event: DomainEvent): DomainEvent {
    return EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: false });
  }
}
