import { DomainEvent, DomainEventClass } from '../../domain/DomainEvent.js';
import ContinuationLocalStorage from '../Sessions/ContinuationLocalStorage.js';

export class EventBusCorrelationIdMetaEnricher {
  static enrich(event: DomainEvent, options: { preserveImmutability: boolean }): DomainEvent {
    const ctx = ContinuationLocalStorage.getContext();

    if (!ctx) {
      return event;
    }

    const meta = { ...event.meta, 'x-correlation-id': ctx.correlationId };

    if (!options.preserveImmutability) {
      event.meta = meta;
      return event;
    }

    const eventClass = event.constructor as (new (...args: never[]) => unknown) & DomainEventClass;

    // DomainEvent declares fromPrimitives but cannot enforce it on subclasses:
    // fall back to a shallow clone so a missing implementation never crashes publish
    if (typeof eventClass.fromPrimitives !== 'function') {
      const clone: DomainEvent = Object.assign(Object.create(Object.getPrototypeOf(event)) as DomainEvent, event);
      clone.meta = meta;

      return clone;
    }

    return eventClass.fromPrimitives({
      aggregateId: event.aggregateId,
      eventId: event.eventId,
      occurredOn: event.occurredOn,
      attributes: event.attributes,
      meta
    });
  }
}
