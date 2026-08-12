import { VideoclipProcess } from '../../domain/VideoclipProcess.js';
import { VideoclipProcessPersistenceRepository } from '../../domain/repository/VideoclipProcessPersistenceRepository.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { VideoclipProcessId } from '../../domain/value-object/VideoclipProcessId.js';
import { VideoclipProcessSongId } from '../../domain/value-object/VideoclipProcessSongId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { VideoclipProcessStatus } from '../../domain/value-object/VideoclipProcessStatus.js';
import { Prisma } from '@prisma/client';

export class VideoclipProcessPrismaRepository implements VideoclipProcessPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  async save(videoclipProcess: VideoclipProcess): Promise<void> {
    const primitives = videoclipProcess.toPrimitives();
    const events = videoclipProcess.pullDomainEvents({ drain: false });

    const data = {
      status: primitives.status,
      songId: primitives.songId,
      aiPayload: (primitives.aiPayload ?? Prisma.DbNull) as Prisma.InputJsonValue,
      aiResponse: (primitives.aiResponse ?? Prisma.DbNull) as Prisma.InputJsonValue,
      finalGcsPath: primitives.finalGcsPath,
      startedAt: primitives.startedAt,
      updatedAt: primitives.updatedAt
    };

    await this.client.$transaction(async (tx) => {
      await tx.videoclipProcess.upsert({
        where: { id: primitives.id },
        update: data,
        create: {
          id: primitives.id,
          ...data
        }
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }

  async search(id: VideoclipProcessId): Promise<Nullable<VideoclipProcess>> {
    const videoclipProcessDb = await this.client.videoclipProcess.findUnique({
      where: { id: id.value }
    });

    return this.toDomain(videoclipProcessDb);
  }

  async searchActiveBySongId(songId: VideoclipProcessSongId): Promise<Nullable<VideoclipProcess>> {
    const videoclipProcessDb = await this.client.videoclipProcess.findFirst({
      where: { songId: songId.value, status: { in: [...VideoclipProcessStatus.activeValues()] } },
      orderBy: { startedAt: 'desc' }
    });

    return this.toDomain(videoclipProcessDb);
  }

  private toDomain(
    videoclipProcessDb: {
      id: string;
      status: string;
      songId: string;
      aiPayload: Prisma.JsonValue;
      aiResponse: Prisma.JsonValue;
      finalGcsPath: string | null;
      startedAt: Date;
      updatedAt: Date;
    } | null
  ): Nullable<VideoclipProcess> {
    if (!videoclipProcessDb) {
      return null;
    }

    return VideoclipProcess.fromPrimitives({
      id: videoclipProcessDb.id,
      status: videoclipProcessDb.status,
      songId: videoclipProcessDb.songId,
      aiPayload: videoclipProcessDb.aiPayload as Record<string, unknown> | null,
      aiResponse: videoclipProcessDb.aiResponse as Record<string, unknown> | null,
      finalGcsPath: videoclipProcessDb.finalGcsPath,
      startedAt: videoclipProcessDb.startedAt,
      updatedAt: videoclipProcessDb.updatedAt
    });
  }
}
