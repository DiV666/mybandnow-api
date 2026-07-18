import { beforeEach, describe, expect, it } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { OutboxEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxEventBus.js';
import { Outbox } from '../../../../../../../src/Contexts/Shared/domain/Outbox.js';
import { EventBus } from '../../../../../../../src/Contexts/Shared/domain/EventBus.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { DomainEvent } from '../../../../../../../src/Contexts/Shared/domain/DomainEvent.js';

class TestDomainEvent extends DomainEvent {}

describe('OutboxEventBus', () => {
  let outbox: MockProxy<Outbox>;
  let innerBus: MockProxy<EventBus>;
  let logger: MockProxy<Logger>;
  let eventBus: OutboxEventBus;

  const domainEvent = new TestDomainEvent({
    aggregateId: 'aggregate-id',
    eventId: 'event-id',
    eventName: 'test.event',
    occurredOn: new Date('2026-06-16T00:00:00.000Z'),
    meta: { 'x-correlation-id': 'corr-id' }
  });

  const waitForImmediate = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    outbox = mock<Outbox>();
    innerBus = mock<EventBus>();
    logger = mock<Logger>();
    eventBus = new OutboxEventBus(outbox, innerBus, logger);
  });

  it('saves events to the outbox and marks them as published when the inner bus publish succeeds', async () => {
    // Arrange
    outbox.save.mockResolvedValue(['outbox-id']);
    innerBus.publish.mockResolvedValue(undefined);
    outbox.markAsPublished.mockResolvedValue(undefined);

    // Act
    await eventBus.publish([domainEvent]);
    await waitForImmediate();

    // Assert
    expect(outbox.save).toHaveBeenCalledWith([domainEvent]);
    expect(innerBus.publish).toHaveBeenCalledWith([domainEvent]);
    expect(outbox.markAsPublished).toHaveBeenCalledWith(['outbox-id']);
    expect(logger.debug).toHaveBeenCalledWith(
      {
        aggregateId: 'aggregate-id',
        correlationId: 'corr-id',
        eventCount: 1,
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'immediate-publish'
      },
      'domain_event.publish.immediate.succeeded'
    );
  });

  it('reuses repository-persisted outbox ids instead of creating duplicate outbox rows', async () => {
    // Arrange
    const persistedDomainEvent = new TestDomainEvent({
      aggregateId: 'aggregate-id',
      eventId: 'event-id',
      eventName: 'test.event',
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
      meta: {
        'x-correlation-id': 'corr-id',
        outboxIds: ['persisted-outbox-id']
      }
    });
    innerBus.publish.mockResolvedValue(undefined);
    outbox.markAsPublished.mockResolvedValue(undefined);

    // Act
    await eventBus.publish([persistedDomainEvent]);
    await waitForImmediate();

    // Assert
    expect(outbox.save).not.toHaveBeenCalled();
    expect(innerBus.publish).toHaveBeenCalledWith([persistedDomainEvent]);
    expect(outbox.markAsPublished).toHaveBeenCalledWith(['persisted-outbox-id']);
    expect(logger.debug).toHaveBeenCalledWith(
      {
        aggregateId: 'aggregate-id',
        correlationId: 'corr-id',
        eventCount: 1,
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'persisted-outbox-id',
        source: 'immediate-publish'
      },
      'domain_event.publish.immediate.succeeded'
    );
  });

  it('does not mark events as published when the inner bus publish fails, so the poller can retry them', async () => {
    // Arrange
    outbox.save.mockResolvedValue(['outbox-id']);
    innerBus.publish.mockRejectedValue(new Error('RabbitMQ unavailable'));

    // Act
    await eventBus.publish([domainEvent]);
    await waitForImmediate();

    // Assert
    expect(outbox.save).toHaveBeenCalledWith([domainEvent]);
    expect(outbox.markAsPublished).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: 'aggregate-id',
        correlationId: 'corr-id',
        errorType: 'Error',
        eventCount: 1,
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'immediate-publish'
      }),
      'domain_event.publish.immediate.failed'
    );
  });

  it('logs an accurate warning and does not treat it as a publish failure when markAsPublished throws after a successful publish', async () => {
    // Arrange
    outbox.save.mockResolvedValue(['outbox-id']);
    innerBus.publish.mockResolvedValue(undefined);
    outbox.markAsPublished.mockRejectedValue(new Error('Database unavailable'));

    // Act
    await eventBus.publish([domainEvent]);
    await waitForImmediate();

    // Assert
    expect(innerBus.publish).toHaveBeenCalledWith([domainEvent]);
    expect(outbox.markAsPublished).toHaveBeenCalledWith(['outbox-id']);
    expect(logger.warn).toHaveBeenCalledWith(
      {
        aggregateId: 'aggregate-id',
        correlationId: 'corr-id',
        errorType: 'Error',
        eventCount: 1,
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'immediate-publish'
      },
      'domain_event.publish.immediate.failed'
    );
  });

  it('classifies a non-Error inner-bus publish failure as UnknownError', async () => {
    // Arrange
    outbox.save.mockResolvedValue(['outbox-id']);
    innerBus.publish.mockRejectedValue('broker-unreachable');

    // Act
    await eventBus.publish([domainEvent]);
    await waitForImmediate();

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-id',
        errorType: 'UnknownError',
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'immediate-publish'
      }),
      'domain_event.publish.immediate.failed'
    );
  });

  it('classifies a non-Error markAsPublished failure as UnknownError', async () => {
    // Arrange
    outbox.save.mockResolvedValue(['outbox-id']);
    innerBus.publish.mockResolvedValue(undefined);
    outbox.markAsPublished.mockRejectedValue('db-unavailable');

    // Act
    await eventBus.publish([domainEvent]);
    await waitForImmediate();

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'corr-id',
        errorType: 'UnknownError',
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'immediate-publish'
      }),
      'domain_event.publish.immediate.failed'
    );
  });

  it('delegates start() to the inner bus', async () => {
    // Arrange
    innerBus.start.mockResolvedValue(undefined);

    // Act
    await eventBus.start();

    // Assert
    expect(innerBus.start).toHaveBeenCalledOnce();
  });

  it('delegates stop() to the inner bus', async () => {
    // Arrange
    innerBus.stop.mockResolvedValue(undefined);

    // Act
    await eventBus.stop();

    // Assert
    expect(innerBus.stop).toHaveBeenCalledOnce();
  });

  it('does nothing when the events array is empty', async () => {
    // Act
    await eventBus.publish([]);

    // Assert
    expect(outbox.save).not.toHaveBeenCalled();
    expect(innerBus.publish).not.toHaveBeenCalled();
    expect(outbox.markAsPublished).not.toHaveBeenCalled();
  });
});
