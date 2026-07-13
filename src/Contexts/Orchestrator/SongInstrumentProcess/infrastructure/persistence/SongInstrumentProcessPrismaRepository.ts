import { SongInstrumentProcess } from '../../domain/SongInstrumentProcess.js';
import { SongInstrumentProcessPersistenceRepository } from '../../domain/repository/SongInstrumentProcessPersistenceRepository.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { SongInstrumentProcessId } from '../../domain/value-object/SongInstrumentProcessId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { Prisma } from '@prisma/client';

export class SongInstrumentProcessPrismaRepository implements SongInstrumentProcessPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  async save(songInstrumentProcess: SongInstrumentProcess): Promise<void> {
    const primitives = songInstrumentProcess.toPrimitives();
    const events = songInstrumentProcess.pullDomainEvents({ drain: false });

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
      await tx.songInstrumentProcess.upsert({
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

  async search(id: SongInstrumentProcessId): Promise<Nullable<SongInstrumentProcess>> {
    const songInstrumentProcessDb = await this.client.songInstrumentProcess.findUnique({
      where: { id: id.value }
    });

    if (!songInstrumentProcessDb) {
      return null;
    }

    return SongInstrumentProcess.fromPrimitives({
      id: songInstrumentProcessDb.id,
      status: songInstrumentProcessDb.status,
      gcsPath: songInstrumentProcessDb.gcsPath,
      fileSize: songInstrumentProcessDb.fileSize,
      codec: songInstrumentProcessDb.codec,
      ffprobeLog: songInstrumentProcessDb.ffprobeLog as Record<string, unknown> | null,
      updatedAt: songInstrumentProcessDb.updatedAt
    });
  }
}
