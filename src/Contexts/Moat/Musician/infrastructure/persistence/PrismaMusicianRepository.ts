import pkg from '@prisma/client';
const { Prisma } = pkg;
import { Musician } from '../../domain/Musician.js';
import { MusicianRepository } from '../../domain/repository/MusicianRepository.js';
import { MusicianId } from '../../domain/value-object/MusicianId.js';
import { MusicianUserId } from '../../domain/value-object/MusicianUserId.js';
import { MusicianUsername } from '../../domain/value-object/MusicianUsername.js';
import { InvalidArgumentException } from '../../../../Shared/domain/exceptions/InvalidArgumentException.js';
import { Nullable } from '../../../../Shared/domain/Nullable.js';

import { PrismaClientFactory } from '../../../../Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

export class PrismaMusicianRepository implements MusicianRepository {
  private prisma = PrismaClientFactory.createClient();

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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new InvalidArgumentException({
            code: 'MUSICIAN_USER_NOT_FOUND',
            message: `Cannot save musician ${primitives.id} because user ${primitives.userId} does not exist.`
          });
        }
      }
      throw error;
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
