import { DomainEvent } from './DomainEvent.js';

export abstract class AggregateRoot {
  private domainEvents: Array<DomainEvent>;

  constructor() {
    this.domainEvents = [];
  }

  pullDomainEvents({ drain = true }: { drain?: boolean } = {}): Array<DomainEvent> {
    const domainEvents = this.domainEvents.slice();
    if (drain) {
      this.domainEvents = [];
    }

    return domainEvents;
  }

  record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  abstract toPrimitives(): Record<string, unknown>;
}
