import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentVideo, SongInstrumentVideoPrimitives } from '../../domain/SongInstrumentVideo.js';
import { SongInstrumentVideoExistException } from '../../domain/exception/SongInstrumentVideoExistException.js';
import { SongInstrumentVideoPersistenceRepository } from '../../domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { SongInstrumentVideoId } from '../../domain/value-object/SongInstrumentVideoId.js';
import { SongInstrumentVideoSongInstrumentId } from '../../domain/value-object/SongInstrumentVideoSongInstrumentId.js';

export class SongInstrumentVideoPrismaRepository implements SongInstrumentVideoPersistenceRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  private isPrismaKnownRequestError(error: unknown): error is { code: string } & Error {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string';
  }

  private throwTranslatedPersistenceError(primitives: SongInstrumentVideoPrimitives, error: unknown): never {
    if (!this.isPrismaKnownRequestError(error)) {
      throw error;
    }

    if (error.code === 'P2002') {
      throw new SongInstrumentVideoExistException(primitives.id);
    }

    if (error.code === 'P2003') {
      throw new SongInstrumentNotExistException(primitives.songInstrumentId);
    }

    throw error;
  }

  async save(songInstrumentVideo: SongInstrumentVideo): Promise<void> {
    const primitives = songInstrumentVideo.toPrimitives();
    const events = songInstrumentVideo.pullDomainEvents({ drain: false });

    try {
      await this.client.$transaction(async (tx) => {
        await tx.songInstrumentVideo.upsert({
          where: { id: primitives.id },
          update: {
            songInstrumentId: primitives.songInstrumentId,
            url: primitives.url,
            duration: primitives.duration,
            size: primitives.size,
            startTimeMs: primitives.startTimeMs,
            createdAt: primitives.createdAt
          },
          create: {
            id: primitives.id,
            songInstrumentId: primitives.songInstrumentId,
            url: primitives.url,
            duration: primitives.duration,
            size: primitives.size,
            startTimeMs: primitives.startTimeMs,
            createdAt: primitives.createdAt
          }
        });

        if (events.length > 0) {
          await this.outbox.save(events, tx as unknown as TransactionSession);
        }
      });
    } catch (error: unknown) {
      this.throwTranslatedPersistenceError(primitives, error);
    }
  }

  async search(id: SongInstrumentVideoId): Promise<Nullable<SongInstrumentVideo>> {
    const document = await this.client.songInstrumentVideo.findUnique({
      where: { id: id.value }
    });

    if (!document) {
      return null;
    }

    return this.toDomain(document);
  }

  async searchBySongInstrumentId(
    songInstrumentId: SongInstrumentVideoSongInstrumentId
  ): Promise<Nullable<SongInstrumentVideo>> {
    const document = await this.client.songInstrumentVideo.findUnique({
      where: { songInstrumentId: songInstrumentId.value }
    });

    if (!document) {
      return null;
    }

    return this.toDomain(document);
  }

  private toDomain(
    document: {
      id: string;
      songInstrumentId: string;
      url: string;
      duration: number;
      size: number;
      createdAt: Date;
    } & Record<string, unknown>
  ): SongInstrumentVideo {
    return SongInstrumentVideo.fromPrimitives({
      id: document.id,
      songInstrumentId: document.songInstrumentId,
      url: document.url,
      duration: document.duration,
      size: document.size,
      startTimeMs: typeof document.startTimeMs === 'number' ? document.startTimeMs : 0,
      createdAt: document.createdAt
    });
  }
}
