import { Outbox as PrismaOutbox, Prisma, PrismaClient } from '@prisma/client';
import { DomainEvent } from '../../../domain/DomainEvent.js';
import { Outbox, OutboxEvent, TransactionSession } from '../../../domain/Outbox.js';
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer.js';
import { PrismaClientFactory } from '../../persistence/prisma/PrismaClientFactory.js';
import { UuidValueObject } from '../../../domain/value-object/UuidValueObject.js';

type PrismaOutboxWriter = Pick<PrismaClient, 'outbox'> | Pick<Prisma.TransactionClient, 'outbox'>;

const OUTBOX_IDS_META_KEY = 'outboxIds';

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

    const prismaClient = this.resolveOutboxWriter(session);

    let documents;

    try {
      documents = events.map((event) => this.toDocument(event));
    } catch (error) {
      throw new Error('Failed to build outbox persistence documents', {
        cause: error instanceof Error ? error : undefined
      });
    }

    await prismaClient.outbox.createMany({
      data: documents
    });

    documents.forEach((document, index) => {
      events[index].meta[OUTBOX_IDS_META_KEY] = [document.id];
    });

    return documents.map((doc) => doc.id);
  }

  private toDocument(event: DomainEvent) {
    try {
      return {
        id: UuidValueObject.random(),
        eventId: event.eventId,
        eventName: event.eventName,
        aggregateId: event.aggregateId,
        occurredOn: event.occurredOn,
        payload: JSON.parse(DomainEventJsonSerializer.serialize(event)),
        status: 'pending',
        attempts: 0,
        createdAt: new Date()
      };
    } catch (error) {
      throw new Error('Failed to serialize domain event for outbox persistence', {
        cause: error instanceof Error ? error : undefined
      });
    }
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

    return documents.map((document) => this.toPendingOutboxEvent(document));
  }

  private resolveOutboxWriter(session?: TransactionSession): PrismaOutboxWriter {
    return this.isPrismaTransactionClient(session) ? session : this.client;
  }

  private isPrismaTransactionClient(session: unknown): session is Pick<Prisma.TransactionClient, 'outbox'> {
    return typeof session === 'object' && session !== null && 'outbox' in session;
  }

  private toPendingOutboxEvent(document: PrismaOutbox): OutboxEvent {
    return {
      id: document.id,
      eventId: document.eventId,
      eventName: document.eventName,
      aggregateId: document.aggregateId,
      occurredOn: document.occurredOn,
      payload: JSON.stringify(document.payload),
      status: 'pending',
      attempts: document.attempts,
      publishedAt: document.publishedAt ?? undefined,
      errorMessage: document.errorMessage ?? undefined
    };
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
