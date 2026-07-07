import { describe, it, expect, vi } from 'vitest';
import { InMemorySyncEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/InMemory/InMemorySyncEventBus.js';
import { DomainEventSubscribers } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventSubscribers.js';
import ContinuationLocalStorage from '../../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';
import { DomainEventSubscriberDummy } from '../../../../../../utils/mocks/DomainEventSubscriberDummy.js';
import { DomainEventDummyMother } from '../../../../../../utils/mocks/DomainEventDummy.js';

describe('InMemorySyncEventBus', () => {
  it('calls the subscriber when the event it is subscribed to is published', async () => {
    const event = DomainEventDummyMother.random();
    const subscriber = new DomainEventSubscriberDummy();
    const onSpy = vi.spyOn(subscriber, 'on');
    const subscribers = new DomainEventSubscribers([subscriber]);

    const eventBus = new InMemorySyncEventBus();
    eventBus.addSubscribers(subscribers);
    await eventBus.publish([event]);

    expect(onSpy).toHaveBeenCalledWith(event);
  });

  it('start() registers subscribers injected at construction time', async () => {
    const event = DomainEventDummyMother.random();
    const subscriber = new DomainEventSubscriberDummy();
    const onSpy = vi.spyOn(subscriber, 'on');
    const subscribers = new DomainEventSubscribers([subscriber]);

    const eventBus = new InMemorySyncEventBus(subscribers);
    await eventBus.start();
    await eventBus.publish([event]);

    expect(onSpy).toHaveBeenCalledWith(event);
  });

  it('stop() resets subscriptions', async () => {
    const subscriber = new DomainEventSubscriberDummy();
    const subscribers = new DomainEventSubscribers([subscriber]);
    const eventBus = new InMemorySyncEventBus();
    eventBus.addSubscribers(subscribers);

    await eventBus.stop();

    // After stop(), publishing should not call the subscriber
    const onSpy = vi.spyOn(subscriber, 'on');
    await eventBus.publish([DomainEventDummyMother.random()]);
    expect(onSpy).not.toHaveBeenCalled();
  });

  it('preserves event immutability while enriching correlation-id metadata from CLS', async () => {
    const event = DomainEventDummyMother.random();
    event.meta = { source: 'sync-test' };
    const subscriber = new DomainEventSubscriberDummy();
    const onSpy = vi.spyOn(subscriber, 'on');
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-sync',
      requestTime: 1
    });

    const eventBus = new InMemorySyncEventBus(new DomainEventSubscribers([subscriber]));
    await eventBus.start();
    await eventBus.publish([event]);

    const consumedEvent = onSpy.mock.calls[0]?.[0];

    expect(consumedEvent).not.toBe(event);
    expect(consumedEvent?.meta).toEqual({ source: 'sync-test', 'x-correlation-id': 'corr-sync' });
    expect(event.meta).toEqual({ source: 'sync-test' });
  });

  it('appends to an existing subscription list when a second subscriber listens to the same event', async () => {
    // Reset CLS context so an earlier test's mock doesn't leak correlation-id metadata
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);
    const event = DomainEventDummyMother.random();
    const firstSubscriber = new DomainEventSubscriberDummy();
    const secondSubscriber = new DomainEventSubscriberDummy();
    const firstSpy = vi.spyOn(firstSubscriber, 'on');
    const secondSpy = vi.spyOn(secondSubscriber, 'on');
    const subscribers = new DomainEventSubscribers([firstSubscriber, secondSubscriber]);

    const eventBus = new InMemorySyncEventBus();
    eventBus.addSubscribers(subscribers);
    await eventBus.publish([event]);

    expect(firstSpy).toHaveBeenCalledWith(event);
    expect(secondSpy).toHaveBeenCalledWith(event);
  });
});
