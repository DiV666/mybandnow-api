import { TrackProcess } from '../../domain/TrackProcess.js';
import { TrackProcessPersistenceRepository } from '../../domain/repository/TrackProcessPersistenceRepository.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { TrackProcessId } from '../../domain/value-object/TrackProcessId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { Prisma } from '@prisma/client';

export class TrackProcessPrismaRepository implements TrackProcessPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  async save(trackProcess: TrackProcess): Promise<void> {
    const primitives = trackProcess.toPrimitives();
    const events = trackProcess.pullDomainEvents({ drain: false });

    let ffprobeLogVal: Prisma.InputJsonValue = primitives.ffprobeLog as Prisma.InputJsonValue;
    if (!ffprobeLogVal || Object.keys(ffprobeLogVal).length === 0) {
      // Prisma expects null for Json fields if we want DbNull or just null
      ffprobeLogVal = Prisma.DbNull as unknown as Prisma.InputJsonValue;
    }

    const data = {
      status: primitives.status,
      gcsPath: primitives.gcsPath,
      fileSize: primitives.fileSize,
      codec: primitives.codec,
      ffprobeLog: ffprobeLogVal,
      updatedAt: primitives.updatedAt
    };

    await this.client.$transaction(async (tx) => {
      await tx.trackProcess.upsert({
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

  async search(id: TrackProcessId): Promise<Nullable<TrackProcess>> {
    const trackProcessDb = await this.client.trackProcess.findUnique({
      where: { id: id.value }
    });

    if (!trackProcessDb) {
      return null;
    }

    return TrackProcess.fromPrimitives({
      id: trackProcessDb.id,
      status: trackProcessDb.status,
      gcsPath: trackProcessDb.gcsPath,
      fileSize: trackProcessDb.fileSize,
      codec: trackProcessDb.codec,
      ffprobeLog: trackProcessDb.ffprobeLog as Record<string, unknown> | null,
      updatedAt: trackProcessDb.updatedAt
    });
  }
}
