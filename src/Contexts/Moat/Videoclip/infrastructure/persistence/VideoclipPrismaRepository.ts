import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { PrismaClient } from '@prisma/client';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Videoclip } from '../../domain/Videoclip.js';
import { VideoclipPersistenceRepository } from '../../domain/repository/VideoclipPersistenceRepository.js';
import { VideoclipId } from '../../domain/value-object/VideoclipId.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';

export class VideoclipPrismaRepository implements VideoclipPersistenceRepository {
  private client: PrismaClient = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  public async save(videoclip: Videoclip): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { createdAt, ...primitives } = videoclip.toPrimitives();
    // Peek at domain events without clearing them so the use case can still publish to EventBus
    const events = videoclip.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.videoclip.upsert({
        where: { id: videoclip.id.value },
        update: primitives,
        create: primitives
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }

  public async search(id: VideoclipId): Promise<Nullable<Videoclip>> {
    const document = await this.client.videoclip.findUnique({
      where: { id: id.value }
    });

    if (!document) return null;

    return Videoclip.fromPrimitives({
      ...document,
      createdAt: document.createdAt.toISOString()
    });
  }
}
