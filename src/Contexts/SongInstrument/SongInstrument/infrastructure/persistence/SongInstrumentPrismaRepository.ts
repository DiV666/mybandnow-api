import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { Outbox, TransactionSession } from '@Contexts/Shared/domain/Outbox.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentPersistenceRepository } from '../../domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '../../domain/value-object/SongInstrumentId.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '../../domain/value-object/SongInstrumentSongId.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { PrismaCriteriaConverter } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaCriteriaConverter.js';

export class SongInstrumentPrismaRepository
  implements SongInstrumentPersistenceRepository, SongInstrumentAuthorizationRepository
{
  private client = PrismaClientFactory.createClient();
  private converter = new PrismaCriteriaConverter();

  constructor(private readonly outbox: Outbox) {}

  private isPrismaKnownRequestError(error: unknown): error is { code: string } & Error {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string';
  }

  private throwTranslatedPersistenceError(primitives: Primitives<SongInstrument>, error: unknown): never {
    if (this.isPrismaKnownRequestError(error) && error.code === 'P2003') {
      throw new InvalidArgumentException({
        code: 'SONG_INSTRUMENT_RELATION_NOT_FOUND',
        message: `Cannot save song instrument ${primitives.id} because song ${primitives.songId}, musician ${primitives.musicianId}, or instrument ${primitives.instrumentId} does not exist.`
      });
    }

    throw error;
  }

  async save(songInstrument: SongInstrument): Promise<void> {
    const primitives = songInstrument.toPrimitives();
    const events = songInstrument.pullDomainEvents({ drain: false });

    try {
      await this.client.$transaction(async (tx) => {
        await tx.songInstrument.upsert({
          where: { id: primitives.id },
          update: {
            name: primitives.name,
            songId: primitives.songId,
            instrumentId: primitives.instrumentId,
            musicianId: primitives.musicianId,
            createdAt: primitives.createdAt,
            activeUploadAttemptId: primitives.activeUploadAttemptId
          },
          create: {
            id: primitives.id,
            name: primitives.name,
            songId: primitives.songId,
            instrumentId: primitives.instrumentId,
            musicianId: primitives.musicianId,
            createdAt: primitives.createdAt,
            activeUploadAttemptId: primitives.activeUploadAttemptId
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

  async search(id: SongInstrumentId): Promise<Nullable<SongInstrument>> {
    const document = await this.client.songInstrument.findUnique({
      where: { id: id.value }
    });

    if (!document) {
      return null;
    }

    return SongInstrument.fromPrimitives({
      id: document.id,
      name: document.name,
      songId: document.songId,
      instrumentId: document.instrumentId,
      musicianId: document.musicianId,
      createdAt: document.createdAt,
      activeUploadAttemptId: document.activeUploadAttemptId
    });
  }

  async matching(criteria: Criteria): Promise<Array<SongInstrument>> {
    const prismaQuery = this.converter.convert(criteria);
    const documents = await this.client.songInstrument.findMany(prismaQuery);

    return documents.map((document) =>
      SongInstrument.fromPrimitives({
        id: document.id,
        name: document.name,
        songId: document.songId,
        instrumentId: document.instrumentId,
        musicianId: document.musicianId,
        createdAt: document.createdAt,
        activeUploadAttemptId: document.activeUploadAttemptId
      })
    );
  }

  async matchingCount(criteria: Criteria): Promise<number> {
    const prismaQuery = this.converter.convert(criteria);

    return this.client.songInstrument.count({ where: prismaQuery.where });
  }

  async isSongOwnedBy(songId: SongInstrumentSongId, musicianId: SongInstrumentMusicianId): Promise<boolean> {
    const song = await this.client.song.findFirst({
      where: {
        id: songId.value,
        band: {
          ownerId: musicianId.value
        }
      },
      select: {
        id: true
      }
    });

    return song !== null;
  }

  async reassignBandMemberInstruments(
    bandId: string,
    previousMusicianId: SongInstrumentMusicianId,
    newMusicianId: SongInstrumentMusicianId
  ): Promise<number> {
    const result = await this.client.songInstrument.updateMany({
      where: {
        musicianId: previousMusicianId.value,
        song: { bandId }
      },
      data: { musicianId: newMusicianId.value }
    });

    return result.count;
  }

  async isBandMember(songId: SongInstrumentSongId, musicianId: SongInstrumentMusicianId): Promise<boolean> {
    const song = await this.client.song.findFirst({
      where: {
        id: songId.value,
        band: {
          OR: [
            {
              ownerId: musicianId.value
            },
            {
              members: {
                some: {
                  musicianId: musicianId.value
                }
              }
            }
          ]
        }
      },
      select: {
        id: true
      }
    });

    return song !== null;
  }
}
