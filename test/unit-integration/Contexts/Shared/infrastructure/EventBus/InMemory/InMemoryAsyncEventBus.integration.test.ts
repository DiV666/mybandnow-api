import { describe, it, expect, vi } from 'vitest';
import { InMemoryAsyncEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/InMemory/InMemoryAsyncEventBus.js';
import { DomainEventSubscribers } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventSubscribers.js';
import StructuredFallbackLogger from '../../../../../../../src/Contexts/Shared/infrastructure/Logger/StructuredFallbackLogger.js';
import ContinuationLocalStorage from '../../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';
import { DomainEventSubscriberDummy } from '../../../../../../utils/mocks/DomainEventSubscriberDummy.js';
import { DomainEventDummyMother } from '../../../../../../utils/mocks/DomainEventDummy.js';

describe('InMemoryAsyncEventBus', () => {
  let subscriber: DomainEventSubscriberDummy;
  let eventBus: InMemoryAsyncEventBus;

  it('the subscriber should be called when the event it is subscribed to is published', async () => {
    const event = DomainEventDummyMother.random();
    subscriber = new DomainEventSubscriberDummy();
    const onSpy = vi.spyOn(subscriber, 'on').mockResolvedValue();
    const subscribers = new DomainEventSubscribers([subscriber]);

    eventBus = new InMemoryAsyncEventBus(subscribers);
    await eventBus.start();
    await eventBus.publish([event]);

    // Wait for async event processing
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onSpy).toHaveBeenCalledWith(event);
  });

  it('keeps mutating the original event while enriching correlation-id metadata from CLS', async () => {
    const event = DomainEventDummyMother.random();
    event.meta = { source: 'async-test' };
    subscriber = new DomainEventSubscriberDummy();
    const onSpy = vi.spyOn(subscriber, 'on').mockResolvedValue();
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-async',
      requestTime: 1
    });

    eventBus = new InMemoryAsyncEventBus(new DomainEventSubscribers([subscriber]));
    await eventBus.start();
    await eventBus.publish([event]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const consumedEvent = onSpy.mock.calls[0]?.[0];

    expect(consumedEvent).toBe(event);
    expect(event.meta).toEqual({ source: 'async-test', 'x-correlation-id': 'corr-async' });
  });

  it('routes subscriber failures through handlerException instead of leaving them unhandled', async () => {
    const event = DomainEventDummyMother.random();
    subscriber = DomainEventSubscriberDummy.alwaysFails();
    const handlerExceptionSpy = vi.spyOn(subscriber, 'handlerException').mockImplementation(() => undefined);

    eventBus = new InMemoryAsyncEventBus(new DomainEventSubscribers([subscriber]));
    await eventBus.start();
    await eventBus.publish([event]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(handlerExceptionSpy).toHaveBeenCalledWith(expect.any(Error));
  });

  it('stops delivering events to subscribers after stop() removes all listeners', async () => {
    const event = DomainEventDummyMother.random();
    subscriber = new DomainEventSubscriberDummy();
    const onSpy = vi.spyOn(subscriber, 'on').mockResolvedValue();

    eventBus = new InMemoryAsyncEventBus(new DomainEventSubscribers([subscriber]));
    await eventBus.start();
    await eventBus.stop();
    await eventBus.publish([event]);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(onSpy).not.toHaveBeenCalled();
  });

  it('logs only the error type when an unhandled error is emitted', async () => {
    const loggerErrorSpy = vi.spyOn(StructuredFallbackLogger.prototype, 'error').mockImplementation(() => undefined);
    const error = new Error('token=secret');

    eventBus = new InMemoryAsyncEventBus();

    eventBus.emit('error', error);

    expect(loggerErrorSpy).toHaveBeenCalledWith({ errorType: 'Error' }, 'InMemoryAsyncEventBus unhandled error');
  });

  it('classifies a non-Error unhandled error as UnknownError', async () => {
    const loggerErrorSpy = vi.spyOn(StructuredFallbackLogger.prototype, 'error').mockImplementation(() => undefined);

    eventBus = new InMemoryAsyncEventBus();

    eventBus.emit('error', 'plain-string-failure');

    expect(loggerErrorSpy).toHaveBeenCalledWith({ errorType: 'UnknownError' }, 'InMemoryAsyncEventBus unhandled error');
  });
});
