import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '../../../../../src/Contexts/Shared/domain/AggregateRoot.js';
import { DomainEvent } from '../../../../../src/Contexts/Shared/domain/DomainEvent.js';

// Concrete aggregate for testing
class OrderCreated extends DomainEvent {
  static readonly EVENT_NAME = 'order.created';
  constructor(aggregateId: string) {
    super({ eventName: OrderCreated.EVENT_NAME, aggregateId });
  }
}

class Order extends AggregateRoot {
  constructor(readonly id: string) {
    super();
  }

  create(): void {
    this.record(new OrderCreated(this.id));
  }

  toPrimitives(): { id: string } {
    return { id: this.id };
  }
}

describe('AggregateRoot', () => {
  describe('#record and #pullDomainEvents', () => {
    it('starts with no domain events', () => {
      const order = new Order('o-1');
      expect(order.pullDomainEvents()).toEqual([]);
    });

    it('records a domain event', () => {
      const order = new Order('o-2');
      order.create();
      const events = order.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(OrderCreated);
    });

    it('records multiple domain events', () => {
      const order = new Order('o-3');
      order.create();
      order.create();
      const events = order.pullDomainEvents();
      expect(events).toHaveLength(2);
    });

    it('clears events after pulling them (drain: true by default)', () => {
      const order = new Order('o-4');
      order.create();
      order.pullDomainEvents(); // first pull — drains
      const secondPull = order.pullDomainEvents();
      expect(secondPull).toHaveLength(0);
    });

    it('keeps events when drain is false', () => {
      const order = new Order('o-6');
      order.create();
      const firstPull = order.pullDomainEvents({ drain: false });
      const secondPull = order.pullDomainEvents({ drain: false });
      expect(firstPull).toHaveLength(1);
      expect(secondPull).toHaveLength(1);
    });

    it('drains events after peeking with drain: false then pulling with drain: true', () => {
      const order = new Order('o-7');
      order.create();
      order.pullDomainEvents({ drain: false }); // peek
      const finalPull = order.pullDomainEvents(); // drain
      expect(finalPull).toHaveLength(1);
      expect(order.pullDomainEvents()).toHaveLength(0);
    });

    it('returns a copy so the original list is not modified', () => {
      const order = new Order('o-5');
      order.create();
      const pulled = order.pullDomainEvents();
      pulled.push(new OrderCreated('fake')); // mutate the returned array
      const secondPull = order.pullDomainEvents();
      expect(secondPull).toHaveLength(0); // original is empty after pull
    });
  });
});
