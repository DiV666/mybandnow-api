import { DomainEventSubscriber } from '../DomainEventSubscriber.js';

export class RabbitMQQueueFormatter {
  constructor(private context: string) {}

  format(subscriber: DomainEventSubscriber) {
    const value = subscriber.constructor.name;
    const name = value
      .split(/(?=[A-Z])/)
      .join('_')
      .toLowerCase();
    return `${this.context}-${subscriber.module}-${name}`;
  }

  formatRetry(subscriber: DomainEventSubscriber) {
    const name = this.format(subscriber);
    return `retry-${name}`;
  }

  formatDeadLetter(subscriber: DomainEventSubscriber) {
    const name = this.format(subscriber);
    return `dead_letter-${name}`;
  }
}
