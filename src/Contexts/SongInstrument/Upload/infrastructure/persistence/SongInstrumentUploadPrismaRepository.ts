import { SongInstrumentUploadPersistenceRepository } from '../../domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUpload } from '../../domain/SongInstrumentUpload.js';
import { SongInstrumentUploadId } from '../../domain/value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadSongInstrumentId } from '../../domain/value-object/SongInstrumentUploadSongInstrumentId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';

export class SongInstrumentUploadPrismaRepository implements SongInstrumentUploadPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  async save(songInstrumentUpload: SongInstrumentUpload): Promise<void> {
    const data = songInstrumentUpload.toPrimitives();
    const events = songInstrumentUpload.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.songInstrumentUpload.upsert({
        where: { id: data.id },
        update: {
          songId: data.songId,
          instrumentName: data.instrumentName,
          songInstrumentId: data.songInstrumentId,
          status: data.status,
          createdAt: data.createdAt,
          errorMessage: data.errorMessage
        },
        create: {
          id: data.id,
          songId: data.songId,
          instrumentName: data.instrumentName,
          songInstrumentId: data.songInstrumentId,
          status: data.status,
          createdAt: data.createdAt,
          errorMessage: data.errorMessage
        }
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }

  async saveWithSongInstrument(
    songInstrumentUpload: SongInstrumentUpload,
    songInstrument: SongInstrument
  ): Promise<void> {
    const data = songInstrumentUpload.toPrimitives();
    const songInstrumentData = songInstrument.toPrimitives();
    const events = songInstrumentUpload.pullDomainEvents({ drain: false });

    await this.client.$transaction(async (tx) => {
      await tx.songInstrumentUpload.create({
        data: {
          id: data.id,
          songId: data.songId,
          instrumentName: data.instrumentName,
          songInstrumentId: data.songInstrumentId,
          status: data.status,
          createdAt: data.createdAt,
          errorMessage: data.errorMessage
        }
      });

      await tx.songInstrument.update({
        where: { id: songInstrumentData.id },
        data: { activeUploadAttemptId: songInstrumentData.activeUploadAttemptId }
      });

      if (events.length > 0) {
        await this.outbox.save(events, tx as unknown as TransactionSession);
      }
    });
  }

  async search(id: SongInstrumentUploadId): Promise<Nullable<SongInstrumentUpload>> {
    const trackData = await this.client.songInstrumentUpload.findUnique({
      where: { id: id.value }
    });

    if (!trackData) {
      return null;
    }

    return SongInstrumentUpload.fromPrimitives({
      id: trackData.id,
      status: trackData.status,
      instrumentName: trackData.instrumentName,
      songInstrumentId: trackData.songInstrumentId,
      songId: trackData.songId,
      createdAt: trackData.createdAt.toISOString(),
      errorMessage: trackData.errorMessage
    });
  }

  async searchBySongInstrumentId(
    songInstrumentId: SongInstrumentUploadSongInstrumentId
  ): Promise<Nullable<SongInstrumentUpload>> {
    const trackData = await this.client.songInstrumentUpload.findFirst({
      where: {
        songInstrumentId: songInstrumentId.value
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!trackData) {
      return null;
    }

    return SongInstrumentUpload.fromPrimitives({
      id: trackData.id,
      status: trackData.status,
      instrumentName: trackData.instrumentName,
      songInstrumentId: trackData.songInstrumentId,
      songId: trackData.songId,
      createdAt: trackData.createdAt.toISOString(),
      errorMessage: trackData.errorMessage
    });
  }

  async remove(id: SongInstrumentUploadId): Promise<void> {
    await this.client.songInstrumentUpload.delete({
      where: { id: id.value }
    });
  }
}
