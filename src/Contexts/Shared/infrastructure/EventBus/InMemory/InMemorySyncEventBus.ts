import { DomainEvent } from '../../../domain/DomainEvent.js';
import { DomainEventSubscriber } from '../DomainEventSubscriber.js';
import { EventBus } from '../../../domain/EventBus.js';
import { DomainEventSubscribers } from '../DomainEventSubscribers.js';
import { EventBusCorrelationIdMetaEnricher } from '../EventBusCorrelationIdMetaEnricher.js';

type Subscription = {
  boundedCallback: (event: DomainEvent) => Promise<void>;
  originalCallback: (event: DomainEvent) => Promise<void>;
};

export class InMemorySyncEventBus implements EventBus {
  private subscriptions: Map<string, Array<Subscription>>;

  constructor(private readonly subscribers: DomainEventSubscribers = new DomainEventSubscribers([])) {
    this.subscriptions = new Map();
  }

  async start(): Promise<void> {
    await this.addSubscribers(this.subscribers);
  }

  async stop(): Promise<void> {
    this.subscriptions = new Map();
  }

  async publish(events: Array<DomainEvent>): Promise<void> {
    const executions = [];
    for (let event of events) {
      const subscribers = this.subscriptions.get(event.eventName);
      if (subscribers) {
        for (const subscriber of subscribers) {
          event = this.setMetaCorrelationId(event);
          executions.push(subscriber.boundedCallback(event));
        }
      }
    }
    await Promise.all(executions);
  }

  async addSubscribers(subscribers: DomainEventSubscribers): Promise<void> {
    for (const subscriber of subscribers.items) {
      for (const event of subscriber.subscribedTo()) {
        this.subscribe(event, subscriber);
      }
    }
  }

  private subscribe(eventName: string, subscriber: DomainEventSubscriber): void {
    const currentSubscriptions = this.subscriptions.get(eventName);
    const subscription = {
      boundedCallback: async (args: DomainEvent) => {
        await subscriber.on
          .bind(subscriber)(args)
          .catch((ex) => subscriber.handlerException(ex));
      },
      originalCallback: subscriber.on
    };
    if (currentSubscriptions) {
      currentSubscriptions.push(subscription);
    } else {
      this.subscriptions.set(eventName, [subscription]);
    }
  }

  private setMetaCorrelationId(event: DomainEvent): DomainEvent {
    return EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: true });
  }
}
