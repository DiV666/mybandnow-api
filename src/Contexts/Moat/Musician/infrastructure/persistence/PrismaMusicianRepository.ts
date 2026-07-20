import { Musician } from '../../domain/Musician.js';
import { MusicianRepository } from '../../domain/repository/MusicianRepository.js';
import { MusicianId } from '../../domain/value-object/MusicianId.js';
import { MusicianUserId } from '../../domain/value-object/MusicianUserId.js';
import { MusicianUsername } from '../../domain/value-object/MusicianUsername.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { MusicianUsernameAlreadyExistsException } from '../../domain/exception/MusicianUsernameAlreadyExistsException.js';
import { MusicianUserAlreadyHasProfileException } from '../../domain/exception/MusicianUserAlreadyHasProfileException.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

export class PrismaMusicianRepository implements MusicianRepository {
  private prisma = PrismaClientFactory.createClient();

  private isPrismaKnownRequestError(error: unknown): error is {
    code: string;
    meta?: {
      target?: unknown;
      driverAdapterError?: {
        cause?: {
          constraint?: {
            fields?: unknown;
          };
        };
      };
    };
  } & Error {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string';
  }

  private matchesTargetValue(target: unknown, fieldName: string): boolean {
    if (Array.isArray(target)) {
      return target.some((entry) => typeof entry === 'string' && entry.replaceAll('"', '').includes(fieldName));
    }

    return typeof target === 'string' && target.replaceAll('"', '').includes(fieldName);
  }

  private isUniqueConstraintTarget(
    error: {
      meta?: {
        target?: unknown;
        driverAdapterError?: {
          cause?: {
            constraint?: {
              fields?: unknown;
            };
          };
        };
      };
    },
    fieldName: string
  ): boolean {
    const target = error.meta?.target;

    if (target !== undefined) {
      return this.matchesTargetValue(target, fieldName);
    }

    const driverConstraintFields = error.meta?.driverAdapterError?.cause?.constraint?.fields;

    return this.matchesTargetValue(driverConstraintFields, fieldName);
  }

  private throwTranslatedPersistenceError(primitives: Primitives<Musician>, error: unknown): never {
    if (this.isPrismaKnownRequestError(error)) {
      if (error.code === 'P2002') {
        if (this.isUniqueConstraintTarget(error, 'username')) {
          throw new MusicianUsernameAlreadyExistsException(primitives.username);
        }

        if (this.isUniqueConstraintTarget(error, 'userId')) {
          throw new MusicianUserAlreadyHasProfileException(primitives.userId);
        }
      }

      if (error.code === 'P2003') {
        throw new InvalidArgumentException({
          code: 'MUSICIAN_USER_NOT_FOUND',
          message: `Cannot save musician ${primitives.id} because user ${primitives.userId} does not exist.`
        });
      }
    }

    throw error;
  }

  async save(musician: Musician): Promise<void> {
    const primitives = musician.toPrimitives();

    try {
      await this.prisma.musician.upsert({
        where: { id: primitives.id },
        update: {
          userId: primitives.userId,
          realName: primitives.name,
          username: primitives.username
        },
        create: {
          id: primitives.id,
          userId: primitives.userId,
          realName: primitives.name,
          username: primitives.username,
          instruments: [] // Default value as required by prisma if we don't have it in primitives yet
        }
      });
    } catch (error: unknown) {
      this.throwTranslatedPersistenceError(primitives, error);
    }
  }

  async search(id: MusicianId): Promise<Nullable<Musician>> {
    const musicianDb = await this.prisma.musician.findUnique({
      where: { id: id.value }
    });

    if (!musicianDb) {
      return null;
    }

    return Musician.fromPrimitives({
      id: musicianDb.id,
      userId: musicianDb.userId,
      name: musicianDb.realName ?? '',
      username: musicianDb.username
    });
  }

  async searchByEmail(email: string): Promise<Nullable<Musician>> {
    const musicianDb = await this.prisma.musician.findFirst({
      where: {
        user: {
          email
        }
      }
    });

    if (!musicianDb) {
      return null;
    }

    return Musician.fromPrimitives({
      id: musicianDb.id,
      userId: musicianDb.userId,
      name: musicianDb.realName ?? '',
      username: musicianDb.username
    });
  }

  async searchByUserId(userId: MusicianUserId): Promise<Nullable<Musician>> {
    const musicianDb = await this.prisma.musician.findUnique({
      where: { userId: userId.value }
    });

    if (!musicianDb) {
      return null;
    }

    return Musician.fromPrimitives({
      id: musicianDb.id,
      userId: musicianDb.userId,
      name: musicianDb.realName ?? '',
      username: musicianDb.username
    });
  }

  async searchByUsername(username: MusicianUsername): Promise<Nullable<Musician>> {
    const musicianDb = await this.prisma.musician.findUnique({
      where: { username: username.value }
    });

    if (!musicianDb) {
      return null;
    }

    return Musician.fromPrimitives({
      id: musicianDb.id,
      userId: musicianDb.userId,
      name: musicianDb.realName ?? '',
      username: musicianDb.username
    });
  }
}
