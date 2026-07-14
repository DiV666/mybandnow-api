import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { Song } from '../../domain/Song.js';
import { SongExistException } from '../../domain/exception/SongExistException.js';
import { SongAuthorizationRepository } from '../../domain/repository/SongAuthorizationRepository.js';
import { SongPersistenceRepository } from '../../domain/repository/SongPersistenceRepository.js';
import { SongBandId } from '../../domain/value-object/SongBandId.js';
import { SongId } from '../../domain/value-object/SongId.js';
import { SongMusicianId } from '../../domain/value-object/SongMusicianId.js';

export class SongPrismaRepository implements SongPersistenceRepository, SongAuthorizationRepository {
  private client = PrismaClientFactory.createClient();

  constructor(private readonly outbox: Outbox) {}

  private isPrismaKnownRequestError(error: unknown): error is { code: string } & Error {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string';
  }

  private throwTranslatedPersistenceError(primitives: Primitives<Song>, error: unknown): never {
    if (!this.isPrismaKnownRequestError(error)) {
      throw error;
    }

    if (error.code === 'P2002') {
      throw new SongExistException(primitives.id);
    }

    if (error.code === 'P2003') {
      throw new InvalidArgumentException({
        code: 'SONG_RELATION_NOT_FOUND',
        message: `Cannot save song ${primitives.id} because band ${primitives.bandId} does not exist.`
      });
    }

    throw error;
  }

  async search(id: SongId): Promise<Nullable<Song>> {
    const document = await this.client.song.findUnique({
      where: { id: id.value }
    });

    if (!document) {
      return null;
    }

    return Song.fromPrimitives(document as Parameters<typeof Song.fromPrimitives>[0]);
  }

  async searchByBandId(bandId: SongBandId): Promise<Array<Song>> {
    const documents = await this.client.song.findMany({
      where: { bandId: bandId.value },
      orderBy: { id: 'asc' }
    });

    return documents.map((document) => Song.fromPrimitives(document as Parameters<typeof Song.fromPrimitives>[0]));
  }

  async countByBandId(bandId: SongBandId): Promise<number> {
    return this.client.song.count({
      where: { bandId: bandId.value }
    });
  }

  async save(song: Song): Promise<void> {
    const primitives = song.toPrimitives();
    const events = song.pullDomainEvents({ drain: false });

    try {
      await this.client.$transaction(async (tx) => {
        await tx.song.create({
          data: primitives
        });

        if (events.length > 0) {
          await this.outbox.save(events, tx as unknown as TransactionSession);
        }
      });
    } catch (error: unknown) {
      this.throwTranslatedPersistenceError(primitives, error);
    }
  }

  async isBandMember(bandId: SongBandId, musicianId: SongMusicianId): Promise<boolean> {
    const band = await this.client.band.findFirst({
      where: {
        id: bandId.value,
        OR: [
          { ownerId: musicianId.value },
          {
            members: {
              some: {
                musicianId: musicianId.value
              }
            }
          }
        ]
      },
      select: {
        id: true
      }
    });

    return band !== null;
  }
}
