import { describe, it, expect, vi } from 'vitest';
import { DomainEventSubscribers } from '../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventSubscribers.js';
import { DomainEventSubscriberDummy } from '../../../../../utils/mocks/DomainEventSubscriberDummy.js';

describe('DomainEventSubscribers', () => {
  describe('constructor', () => {
    it('stores the items array', () => {
      const sub1 = new DomainEventSubscriberDummy();
      const sub2 = new DomainEventSubscriberDummy();
      const subscribers = new DomainEventSubscribers([sub1, sub2]);
      expect(subscribers.items).toHaveLength(2);
      expect(subscribers.items[0]).toBe(sub1);
    });

    it('accepts an empty array', () => {
      const subscribers = new DomainEventSubscribers([]);
      expect(subscribers.items).toHaveLength(0);
    });
  });

  describe('.from(container)', () => {
    it('collects all tagged domainEventSubscriber services from the container', () => {
      // Arrange — mock the ContainerBuilder
      const sub1 = new DomainEventSubscriberDummy();
      const sub2 = new DomainEventSubscriberDummy();

      const mockDefinition = {};
      const mockContainer = {
        findTaggedServiceIds: vi.fn().mockReturnValue([
          { id: 'Subscriber1', definition: mockDefinition },
          { id: 'Subscriber2', definition: mockDefinition }
        ]),
        get: vi.fn().mockImplementation((id: string) => (id === 'Subscriber1' ? sub1 : sub2))
      };

      // Act
      const subscribers = DomainEventSubscribers.from(
        mockContainer as unknown as import('node-dependency-injection').ContainerBuilder
      );

      // Assert
      expect(mockContainer.findTaggedServiceIds).toHaveBeenCalledWith('domainEventSubscriber');
      expect(subscribers.items).toHaveLength(2);
      expect(subscribers.items).toContain(sub1);
      expect(subscribers.items).toContain(sub2);
    });

    it('returns empty subscribers when no tagged services exist', () => {
      const mockContainer = {
        findTaggedServiceIds: vi.fn().mockReturnValue([]),
        get: vi.fn()
      };

      const subscribers = DomainEventSubscribers.from(
        mockContainer as unknown as import('node-dependency-injection').ContainerBuilder
      );
      expect(subscribers.items).toHaveLength(0);
      expect(mockContainer.get).not.toHaveBeenCalled();
    });
  });
});
