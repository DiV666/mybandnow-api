import { DomainEvent } from '../../domain/DomainEvent.js';

export class DomainEventJsonSerializer {
  static serialize(event: DomainEvent): string {
    return JSON.stringify({
      data: event
    });
  }
}
