import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { OutboxPublisher } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPublisher.js';
import { Outbox } from '../../../../../../../src/Contexts/Shared/domain/Outbox.js';
import { EventBus } from '../../../../../../../src/Contexts/Shared/domain/EventBus.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { DomainEventJsonDeserializer } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventJsonDeserializer.js';
import { DomainEvent } from '../../../../../../../src/Contexts/Shared/domain/DomainEvent.js';

class TestDomainEvent extends DomainEvent {}

describe('OutboxPublisher', () => {
  let outbox: MockProxy<Outbox>;
  let eventBus: MockProxy<EventBus>;
  let deserializer: MockProxy<DomainEventJsonDeserializer>;
  let logger: MockProxy<Logger>;

  beforeEach(() => {
    vi.useFakeTimers();
    outbox = mock<Outbox>();
    eventBus = mock<EventBus>();
    deserializer = mock<DomainEventJsonDeserializer>();
    logger = mock<Logger>();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts once, publishes pending events through the public API, and marks them as published', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);
    const domainEvent = new TestDomainEvent({
      aggregateId: 'aggregate-id',
      eventId: 'event-id',
      eventName: 'test.event',
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
      meta: { 'x-correlation-id': 'corr-id' }
    });

    outbox.pending.mockResolvedValue([
      {
        id: 'outbox-id',
        eventId: 'event-id',
        eventName: 'test.event',
        aggregateId: 'aggregate-id',
        occurredOn: new Date('2026-06-16T00:00:00.000Z'),
        payload: '{"data":{}}',
        status: 'pending',
        attempts: 0
      }
    ]);
    deserializer.deserialize.mockReturnValue(domainEvent);
    eventBus.publish.mockResolvedValue(undefined);
    outbox.markAsPublished.mockResolvedValue(undefined);

    // Act
    publisher.start();
    await vi.advanceTimersByTimeAsync(5000);

    // Assert
    expect(logger.info).toHaveBeenCalledWith('OutboxPublisher started');
    expect(outbox.pending).toHaveBeenCalledWith(100);
    expect(eventBus.publish).toHaveBeenCalledWith([domainEvent]);
    expect(outbox.markAsPublished).toHaveBeenCalledWith(['outbox-id']);
    expect(logger.debug).toHaveBeenCalledWith(
      {
        aggregateId: 'aggregate-id',
        attempts: 0,
        correlationId: 'corr-id',
        eventCount: 1,
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'outbox-poller'
      },
      'domain_event.publish.outbox_poller.succeeded'
    );
  });

  it('does not start a second polling interval when start() is called twice', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);
    outbox.pending.mockResolvedValue([]);

    // Act
    publisher.start();
    publisher.start();
    await vi.advanceTimersByTimeAsync(5000);

    // Assert
    expect(logger.warn).toHaveBeenCalledWith('OutboxPublisher already running');
    expect(outbox.pending).toHaveBeenCalledTimes(1);
  });

  it('stops polling after stop() is called', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);
    outbox.pending.mockResolvedValue([]);

    // Act
    publisher.start();
    await publisher.stop();
    await vi.advanceTimersByTimeAsync(5000);

    // Assert
    expect(logger.info).toHaveBeenCalledWith('OutboxPublisher stopped');
    expect(outbox.pending).not.toHaveBeenCalled();
  });

  it('marks an event as failed on the last allowed retry', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);

    outbox.pending.mockResolvedValue([
      {
        id: 'outbox-id',
        eventId: 'event-id',
        eventName: 'test.event',
        aggregateId: 'aggregate-id',
        occurredOn: new Date('2026-06-16T00:00:00.000Z'),
        payload: '{"data":{}}',
        status: 'pending',
        attempts: 2
      }
    ]);
    deserializer.deserialize.mockImplementation(() => {
      throw new Error('RabbitMQ unavailable');
    });

    // Act
    // @ts-expect-error testing private orchestration method directly
    await publisher.processOutbox();

    // Assert
    expect(outbox.markAsFailed).toHaveBeenCalledWith('outbox-id', 'RabbitMQ unavailable');
    expect(outbox.incrementAttempts).not.toHaveBeenCalled();
  });

  it('stops cleanly when stop() is called without a prior start()', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);

    // Act
    await publisher.stop();

    // Assert
    expect(logger.info).toHaveBeenCalledWith('OutboxPublisher stopped');
    expect(outbox.pending).not.toHaveBeenCalled();
  });

  it('skips a tick while the previous batch is still in flight to avoid duplicate publishes', async () => {
    // Arrange — the first batch takes longer than the poll interval
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);
    let resolvePending!: (value: never[]) => void;
    outbox.pending.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePending = resolve as (value: never[]) => void;
        })
    );
    outbox.pending.mockResolvedValue([]);

    // Act — two intervals elapse while the first batch is still running
    publisher.start();
    await vi.advanceTimersByTimeAsync(5000);
    await vi.advanceTimersByTimeAsync(5000);

    // Assert — the overlapping tick was skipped
    expect(outbox.pending).toHaveBeenCalledTimes(1);

    // Act — the first batch finishes, so the next tick runs again
    resolvePending([]);
    await vi.advanceTimersByTimeAsync(5000);

    // Assert
    expect(outbox.pending).toHaveBeenCalledTimes(2);
  });

  it('awaits the in-flight run when stop() is called mid-batch', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);
    let resolvePending!: (value: never[]) => void;
    outbox.pending.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePending = resolve as (value: never[]) => void;
        })
    );

    publisher.start();
    await vi.advanceTimersByTimeAsync(5000);

    // Act
    let stopped = false;
    const stopPromise = publisher.stop().then(() => {
      stopped = true;
    });
    await Promise.resolve();

    // Assert — stop() has not resolved while the batch is in flight
    expect(stopped).toBe(false);

    resolvePending([]);
    await stopPromise;
    expect(stopped).toBe(true);
    expect(logger.info).toHaveBeenCalledWith('OutboxPublisher stopped');
  });

  it('logs and swallows an Error thrown directly by a poll tick', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);
    outbox.pending.mockRejectedValue(new Error('db unavailable'));

    // Act
    publisher.start();
    await vi.advanceTimersByTimeAsync(5000);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ errorType: 'Error' }),
      'OutboxPublisher tick failed'
    );
  });

  it('logs and swallows a non-Error thrown directly by a poll tick', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);

    outbox.pending.mockRejectedValue('db-unavailable');

    // Act
    publisher.start();
    await vi.advanceTimersByTimeAsync(5000);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ errorType: 'UnknownError' }),
      'OutboxPublisher tick failed'
    );
  });

  it('classifies a non-Error deserialization failure as UnknownError with a generic message', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);

    outbox.pending.mockResolvedValue([
      {
        id: 'outbox-id',
        eventId: 'event-id',
        eventName: 'test.event',
        aggregateId: 'aggregate-id',
        occurredOn: new Date('2026-06-16T00:00:00.000Z'),
        payload: '{"data":{}}',
        status: 'pending',
        attempts: 1
      }
    ]);
    deserializer.deserialize.mockImplementation(() => {
      throw { type: 'boom' };
    });

    // Act
    // @ts-expect-error testing private orchestration method directly
    await publisher.processOutbox();

    // Assert
    expect(outbox.incrementAttempts).toHaveBeenCalledWith('outbox-id', 'Unknown error');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        aggregateId: 'aggregate-id',
        attempts: 1,
        errorType: 'UnknownError',
        eventId: 'event-id',
        eventName: 'test.event',
        outboxId: 'outbox-id',
        source: 'outbox-poller'
      }),
      'domain_event.publish.outbox_poller.failed'
    );
  });

  it('increments attempts and keeps the event pending before the last retry', async () => {
    // Arrange
    const publisher = new OutboxPublisher(outbox, eventBus, deserializer, logger, 5000, 100, 3);

    outbox.pending.mockResolvedValue([
      {
        id: 'outbox-id',
        eventId: 'event-id',
        eventName: 'test.event',
        aggregateId: 'aggregate-id',
        occurredOn: new Date('2026-06-16T00:00:00.000Z'),
        payload: '{"data":{}}',
        status: 'pending',
        attempts: 1
      }
    ]);
    deserializer.deserialize.mockImplementation(() => {
      throw new Error('RabbitMQ unavailable');
    });

    // Act
    // @ts-expect-error testing private orchestration method directly
    await publisher.processOutbox();

    // Assert
    expect(outbox.incrementAttempts).toHaveBeenCalledWith('outbox-id', 'RabbitMQ unavailable');
    expect(outbox.markAsFailed).not.toHaveBeenCalled();
  });
});
