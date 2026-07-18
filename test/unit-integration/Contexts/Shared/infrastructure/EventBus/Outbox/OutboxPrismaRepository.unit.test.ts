import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainEvent } from '../../../../../../../src/Contexts/Shared/domain/DomainEvent.js';
import { TransactionSession } from '../../../../../../../src/Contexts/Shared/domain/Outbox.js';

vi.mock('../../../../../../../src/Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js', () => ({
  PrismaClientFactory: {
    createClient: vi.fn()
  }
}));

const { OutboxPrismaRepository } =
  await import('../../../../../../../src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPrismaRepository.js');
const { PrismaClientFactory } =
  await import('../../../../../../../src/Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js');

class TestDomainEvent extends DomainEvent {}

describe('OutboxPrismaRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T00:00:05.000Z'));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('annotates persisted events with their outbox ids so immediate publish can reuse them', async () => {
    // Arrange
    const repository = new OutboxPrismaRepository();
    const createMany = vi.fn().mockResolvedValue(undefined);
    const session = {
      outbox: {
        createMany
      }
    };
    const domainEvent = new TestDomainEvent({
      aggregateId: 'aggregate-id',
      eventId: 'event-id',
      eventName: 'test.event',
      occurredOn: new Date('2026-06-16T00:00:00.000Z')
    });

    // Act
    const outboxIds = await repository.save([domainEvent], session as unknown as TransactionSession);

    // Assert
    expect(createMany).toHaveBeenCalledOnce();
    expect(outboxIds).toHaveLength(1);
    expect(domainEvent.meta.outboxIds).toEqual(outboxIds);
  });

  it('queries pending events at the default five-second boundary inclusively', async () => {
    // Arrange
    const repository = new OutboxPrismaRepository();
    const findMany = vi.fn().mockResolvedValue([]);

    vi.mocked(PrismaClientFactory.createClient).mockReturnValue({
      outbox: {
        findMany
      }
    } as never);

    // Act
    await repository.pending(10);

    // Assert
    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: 'pending',
        createdAt: { lte: new Date('2026-06-16T00:00:00.000Z') }
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    });
  });

  it('maps pending records returned exactly at the grace threshold', async () => {
    // Arrange
    const repository = new OutboxPrismaRepository();
    const boundaryRecord = {
      id: 'outbox-id',
      eventId: 'event-id',
      eventName: 'test.event',
      aggregateId: 'aggregate-id',
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
      payload: { foo: 'bar' },
      status: 'pending',
      attempts: 2,
      publishedAt: null,
      errorMessage: null,
      createdAt: new Date('2026-06-16T00:00:00.000Z')
    };
    const findMany = vi.fn().mockResolvedValue([boundaryRecord]);

    vi.mocked(PrismaClientFactory.createClient).mockReturnValue({
      outbox: {
        findMany
      }
    } as never);

    // Act
    const pendingEvents = await repository.pending(1);

    // Assert
    expect(pendingEvents).toEqual([
      {
        id: 'outbox-id',
        eventId: 'event-id',
        eventName: 'test.event',
        aggregateId: 'aggregate-id',
        occurredOn: new Date('2026-06-16T00:00:00.000Z'),
        payload: JSON.stringify({ foo: 'bar' }),
        status: 'pending',
        attempts: 2,
        publishedAt: undefined,
        errorMessage: undefined
      }
    ]);
  });
});
