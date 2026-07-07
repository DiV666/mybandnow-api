import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { MongoClient } from 'mongodb';
import { format } from 'util';
import { OutboxMongoRepository } from '@Contexts/Shared/infrastructure/EventBus/Outbox/OutboxMongoRepository.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

class TestDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'test.event.created';

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    return new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }

  constructor(params: {
    eventName: string;
    aggregateId: string;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  }) {
    super(params);
    this.attributes = { testData: 'some-value' };
  }
}

describe('OutboxMongoRepository - Integration', () => {
  let repository: OutboxMongoRepository;
  let client: MongoClient;
  let clientPromise: Promise<MongoClient>;

  beforeAll(async () => {
    // Use environment variables for MongoDB connection (same as production code)
    const mongoUri = format(env.MONGO_URI, env.MONGO_USER, env.MONGO_PASS);

    client = new MongoClient(mongoUri);
    await client.connect();
    clientPromise = Promise.resolve(client);
    // Grace period of 0 so tests can read back rows they just saved
    repository = new OutboxMongoRepository(clientPromise, 0);
  }, 30000); // 30s timeout for MongoDB connection in CI/slow environments

  beforeEach(async () => {
    // Clean outbox collection before each test
    const collection = await repository['collection']();
    await collection.deleteMany({});
  });

  afterAll(async () => {
    await client?.close();
  });

  it('should save domain events to outbox with pending status', async () => {
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-123',
      eventId: 'event-456',
      occurredOn: new Date()
    });

    await repository.save([event]);

    const pending = await repository.pending(10);

    expect(pending).toHaveLength(1);
    expect(pending[0].eventId).toBe('event-456');
    expect(pending[0].eventName).toBe(TestDomainEvent.EVENT_NAME);
    expect(pending[0].aggregateId).toBe('aggregate-123');
    expect(pending[0].status).toBe('pending');
    expect(pending[0].attempts).toBe(0);
  });

  it('should retrieve pending events sorted by creation time', async () => {
    const event1 = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-1',
      eventId: 'event-1',
      occurredOn: new Date('2024-01-01')
    });

    const event2 = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-2',
      eventId: 'event-2',
      occurredOn: new Date('2024-01-02')
    });

    await repository.save([event2]); // Save event2 first
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to ensure different createdAt
    await repository.save([event1]);

    const pending = await repository.pending(10);

    expect(pending).toHaveLength(2);
    expect(pending[0].eventId).toBe('event-2'); // First saved, first retrieved
    expect(pending[1].eventId).toBe('event-1');
  });

  it('should mark events as published', async () => {
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-123',
      eventId: 'event-456'
    });

    await repository.save([event]);
    const pending = await repository.pending(10);
    const eventId = pending[0].id;

    await repository.markAsPublished([eventId]);

    const stillPending = await repository.pending(10);
    expect(stillPending).toHaveLength(0);

    // Verify it's marked as published in DB
    const collection = await repository['collection']();
    const published = await collection.findOne({ _id: eventId as never });
    expect(published?.status).toBe('published');
    expect(published?.publishedAt).toBeDefined();
  });

  it('should mark events as failed with error message', async () => {
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-123',
      eventId: 'event-456'
    });

    await repository.save([event]);
    const pending = await repository.pending(10);
    const eventId = pending[0].id;

    await repository.markAsFailed(eventId, 'RabbitMQ connection failed');

    const stillPending = await repository.pending(10);
    expect(stillPending).toHaveLength(0);

    // Verify it's marked as failed in DB
    const collection = await repository['collection']();
    const failed = await collection.findOne({ _id: eventId as never });
    expect(failed?.status).toBe('failed');
    expect(failed?.errorMessage).toBe('RabbitMQ connection failed');
    expect(failed?.attempts).toBe(1); // Incremented
  });

  it('should increment attempts and keep events pending before max retries', async () => {
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-123',
      eventId: 'event-456'
    });

    await repository.save([event]);
    const pending = await repository.pending(10);
    const eventId = pending[0].id;

    await repository.incrementAttempts(eventId, 'RabbitMQ connection failed');

    const stillPending = await repository.pending(10);
    expect(stillPending).toHaveLength(1);
    expect(stillPending[0].id).toBe(eventId);
    expect(stillPending[0].attempts).toBe(1);
    expect(stillPending[0].errorMessage).toBe('RabbitMQ connection failed');

    const collection = await repository['collection']();
    const retried = await collection.findOne({ _id: eventId as never });
    expect(retried?.status).toBe('pending');
  });

  it('should limit the number of pending events retrieved', async () => {
    const events = Array.from(
      { length: 5 },
      (_, i) =>
        new TestDomainEvent({
          eventName: TestDomainEvent.EVENT_NAME,
          aggregateId: `aggregate-${i}`,
          eventId: `event-${i}`
        })
    );

    await repository.save(events);

    const pending = await repository.pending(3);
    expect(pending).toHaveLength(3);
  });

  it('should handle empty events array gracefully', async () => {
    await repository.save([]);
    const pending = await repository.pending(10);
    expect(pending).toHaveLength(0);
  });

  it('should save within a provided MongoDB session', async () => {
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-session',
      eventId: 'event-session'
    });
    const session = client.startSession();

    try {
      await repository.save([event], session as never);
    } finally {
      await session.endSession();
    }

    const pending = await repository.pending(10);
    expect(pending).toHaveLength(1);
    expect(pending[0].eventId).toBe('event-session');
  });

  it('should do nothing when markAsPublished is called with an empty ids array', async () => {
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-123',
      eventId: 'event-456'
    });
    await repository.save([event]);

    await expect(repository.markAsPublished([])).resolves.toBeUndefined();

    const pending = await repository.pending(10);
    expect(pending).toHaveLength(1);
  });

  it('should exclude recently created events from pending until the grace period has elapsed', async () => {
    // Arrange — repository with the default grace period (5000 ms)
    const gracedRepository = new OutboxMongoRepository(clientPromise);
    const event = new TestDomainEvent({
      eventName: TestDomainEvent.EVENT_NAME,
      aggregateId: 'aggregate-grace',
      eventId: 'event-grace'
    });
    const [outboxId] = await gracedRepository.save([event]);

    // Act & Assert — a fresh row is not picked up (still inside the grace window)
    const freshPending = await gracedRepository.pending(10);
    expect(freshPending).toHaveLength(0);

    // Arrange — age the row past the grace period
    const collection = await gracedRepository['collection']();
    await collection.updateOne(
      { _id: outboxId as never },
      { $set: { createdAt: new Date(Date.now() - OutboxMongoRepository.defaultPendingGraceMs - 1000) } }
    );

    // Act & Assert — once older than the grace period, the row becomes visible
    const agedPending = await gracedRepository.pending(10);
    expect(agedPending).toHaveLength(1);
    expect(agedPending[0].eventId).toBe('event-grace');
  });
});
