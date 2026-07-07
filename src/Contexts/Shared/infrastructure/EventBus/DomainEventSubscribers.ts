import { ContainerBuilder, Definition } from 'node-dependency-injection';
import { DomainEventSubscriber } from './DomainEventSubscriber.js';

export class DomainEventSubscribers {
  constructor(public items: Array<DomainEventSubscriber>) {}

  static from(container: ContainerBuilder): DomainEventSubscribers {
    const subscriberDefinitions = new Map(
      Array.from(container.findTaggedServiceIds('domainEventSubscriber')).map((subscriber) => [
        subscriber.id,
        subscriber.definition
      ])
    );
    const subscribers: Array<DomainEventSubscriber> = [];

    subscriberDefinitions.forEach((value: Definition, key: string) => {
      const domainEventSubscriber = container.get<DomainEventSubscriber>(key.toString());
      subscribers.push(domainEventSubscriber);
    });

    return new DomainEventSubscribers(subscribers);
  }
}
