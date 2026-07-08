import { DomainEvent } from '../../../domain/DomainEvent.js';
import { Outbox, OutboxEvent, TransactionSession } from '../../../domain/Outbox.js';
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer.js';
import { PrismaClientFactory } from '../../persistence/prisma/PrismaClientFactory.js';
import { UuidValueObject } from '../../../domain/value-object/UuidValueObject.js';

export class OutboxPrismaRepository implements Outbox {
  static readonly defaultPendingGraceMs = 5000;

  constructor(private readonly pendingGraceMs: number = OutboxPrismaRepository.defaultPendingGraceMs) {}

  private get client() {
    return PrismaClientFactory.createClient();
  }

  async initialize(): Promise<void> {
    // In Prisma, index creation is handled via `prisma db push` or `prisma migrate`.
  }

  async save(events: DomainEvent[], session?: TransactionSession): Promise<string[]> {
    if (events.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prismaClient = (session as any) || this.client;

    const documents = events.map((event) => ({
      id: UuidValueObject.random(),
      eventId: event.eventId,
      eventName: event.eventName,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
      payload: JSON.parse(DomainEventJsonSerializer.serialize(event)),
      status: 'pending',
      attempts: 0,
      createdAt: new Date()
    }));

    await prismaClient.outbox.createMany({
      data: documents
    });

    return documents.map((doc) => doc.id);
  }

  async pending(limit: number): Promise<OutboxEvent[]> {
    const graceThreshold = new Date(Date.now() - this.pendingGraceMs);
    const documents = await this.client.outbox.findMany({
      where: {
        status: 'pending',
        createdAt: { lte: graceThreshold }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return documents.map((doc: any) => ({
      id: doc.id,
      eventId: doc.eventId,
      eventName: doc.eventName,
      aggregateId: doc.aggregateId,
      occurredOn: doc.occurredOn,
      payload: JSON.stringify(doc.payload),
      status: doc.status as 'pending',
      attempts: doc.attempts,
      publishedAt: doc.publishedAt ?? undefined,
      errorMessage: doc.errorMessage ?? undefined
    }));
  }

  async markAsPublished(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.client.outbox.updateMany({
      where: { id: { in: ids } },
      data: { status: 'published', publishedAt: new Date() }
    });
  }

  async incrementAttempts(id: string, errorMessage: string): Promise<void> {
    await this.client.outbox.update({
      where: { id },
      data: {
        errorMessage,
        attempts: { increment: 1 }
      }
    });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await this.client.outbox.update({
      where: { id },
      data: {
        status: 'failed',
        errorMessage,
        attempts: { increment: 1 }
      }
    });
  }
}
