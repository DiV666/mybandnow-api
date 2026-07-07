import { describe, it, expect } from 'vitest';
import { DomainEventJsonDeserializer } from '../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventJsonDeserializer.js';

describe('DomainEventJsonDeserializer', () => {
  describe('#deserialize', () => {
    it('returns the event when the payload contains all required fields', () => {
      const deserializer = new DomainEventJsonDeserializer();
      const rawEvent = {
        eventName: 'test.event',
        aggregateId: 'aggregate-1',
        eventId: 'event-1',
        occurredOn: '2026-01-01T00:00:00.000Z',
        attributes: { foo: 'bar' },
        meta: {}
      };
      const payload = JSON.stringify({ data: rawEvent });

      const result = deserializer.deserialize(payload);

      expect(result).toEqual(rawEvent);
    });

    it.each(['eventName', 'aggregateId', 'eventId', 'occurredOn', 'attributes', 'meta'])(
      'throws when the %s field is missing',
      (missingField) => {
        const deserializer = new DomainEventJsonDeserializer();
        const rawEvent: Record<string, unknown> = {
          eventName: 'test.event',
          aggregateId: 'aggregate-1',
          eventId: 'event-1',
          occurredOn: '2026-01-01T00:00:00.000Z',
          attributes: {},
          meta: {}
        };
        delete rawEvent[missingField];
        const payload = JSON.stringify({ data: rawEvent });

        expect(() => deserializer.deserialize(payload)).toThrow(
          'Invalid DomainEvent structure: missing required fields'
        );
      }
    );

    it('throws when data is not an object', () => {
      const deserializer = new DomainEventJsonDeserializer();
      const payload = JSON.stringify({ data: 'not-an-object' });

      expect(() => deserializer.deserialize(payload)).toThrow('Invalid DomainEvent structure: missing required fields');
    });

    it('throws when data is missing entirely', () => {
      const deserializer = new DomainEventJsonDeserializer();
      const payload = JSON.stringify({});

      expect(() => deserializer.deserialize(payload)).toThrow('Invalid DomainEvent structure: missing required fields');
    });
  });
});
