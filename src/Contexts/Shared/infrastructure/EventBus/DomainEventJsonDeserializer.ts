import { DomainEvent } from '../../domain/DomainEvent.js';

export class DomainEventJsonDeserializer {
  deserialize(payload: string): DomainEvent {
    const parsed = JSON.parse(payload);
    const rawEvent = parsed.data;

    // Type guard: ensure required DomainEvent fields exist
    if (
      !rawEvent ||
      typeof rawEvent !== 'object' ||
      !('eventName' in rawEvent) ||
      !('aggregateId' in rawEvent) ||
      !('eventId' in rawEvent) ||
      !('occurredOn' in rawEvent) ||
      !('attributes' in rawEvent) ||
      !('meta' in rawEvent)
    ) {
      throw new Error('Invalid DomainEvent structure: missing required fields');
    }

    // Return as plain object conforming to DomainEvent interface
    // (same strategy as RabbitMQConsumer — see architecture note there)
    return rawEvent as DomainEvent;
  }
}
