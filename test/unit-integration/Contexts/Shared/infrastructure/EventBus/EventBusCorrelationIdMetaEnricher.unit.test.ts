import { describe, expect, it, vi } from 'vitest';
import ContinuationLocalStorage from '../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';
import { DomainEventDummyMother } from '../../../../../utils/mocks/DomainEventDummy.js';
import { EventBusCorrelationIdMetaEnricher } from '../../../../../../src/Contexts/Shared/infrastructure/EventBus/EventBusCorrelationIdMetaEnricher.js';
import { DomainEvent } from '../../../../../../src/Contexts/Shared/domain/DomainEvent.js';

describe('EventBusCorrelationIdMetaEnricher', () => {
  it('returns the original event when there is no CLS context', () => {
    const event = DomainEventDummyMother.random();
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);

    const enrichedEvent = EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: true });

    expect(enrichedEvent).toBe(event);
    expect(event.meta).toEqual({});
  });

  it('returns a cloned event when immutability must be preserved', () => {
    const event = DomainEventDummyMother.random();
    event.meta = { source: 'test-suite' };
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-sync',
      requestTime: 1
    });

    const enrichedEvent = EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: true });

    expect(enrichedEvent).not.toBe(event);
    expect(enrichedEvent.meta).toEqual({ source: 'test-suite', 'x-correlation-id': 'corr-sync' });
    expect(event.meta).toEqual({ source: 'test-suite' });
    expect(enrichedEvent.eventId).toBe(event.eventId);
    expect(enrichedEvent.aggregateId).toBe(event.aggregateId);
    expect(enrichedEvent.occurredOn).toBe(event.occurredOn);
  });

  it('falls back to a shallow clone when the event class does not implement fromPrimitives', () => {
    // Arrange — a deserialized event class without a static fromPrimitives implementation
    class EventWithoutFromPrimitives extends DomainEvent {}
    const event = new EventWithoutFromPrimitives({
      eventName: 'test.event',
      aggregateId: 'aggregate-id',
      eventId: 'event-id',
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
      meta: { source: 'test-suite' }
    });
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-clone',
      requestTime: 1
    });

    // Act
    const enrichedEvent = EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: true });

    // Assert — no TypeError, immutability preserved via shallow clone
    expect(enrichedEvent).not.toBe(event);
    expect(enrichedEvent).toBeInstanceOf(EventWithoutFromPrimitives);
    expect(enrichedEvent.meta).toEqual({ source: 'test-suite', 'x-correlation-id': 'corr-clone' });
    expect(event.meta).toEqual({ source: 'test-suite' });
    expect(enrichedEvent.eventId).toBe(event.eventId);
    expect(enrichedEvent.aggregateId).toBe(event.aggregateId);
    expect(enrichedEvent.occurredOn).toBe(event.occurredOn);
  });

  it('mutates the original event when immutability is not required', () => {
    const event = DomainEventDummyMother.random();
    event.meta = { source: 'test-suite' };
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-async',
      requestTime: 1
    });

    const enrichedEvent = EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: false });

    expect(enrichedEvent).toBe(event);
    expect(event.meta).toEqual({ source: 'test-suite', 'x-correlation-id': 'corr-async' });
  });
});
