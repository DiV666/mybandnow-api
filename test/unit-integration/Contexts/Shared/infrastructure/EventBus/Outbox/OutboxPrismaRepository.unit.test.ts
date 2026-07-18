import { describe, expect, it, vi } from 'vitest';
import { DomainEvent } from '../../../../../../../src/Contexts/Shared/domain/DomainEvent.js';
import { TransactionSession } from '../../../../../../../src/Contexts/Shared/domain/Outbox.js';

vi.mock('../../../../../../../src/Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js', () => ({
  PrismaClientFactory: {
    createClient: vi.fn()
  }
}));

const { OutboxPrismaRepository } =
  await import('../../../../../../../src/Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPrismaRepository.js');

class TestDomainEvent extends DomainEvent {}

describe('OutboxPrismaRepository', () => {
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
});
