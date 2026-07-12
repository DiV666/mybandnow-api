import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaMusicianRepository } from '@Contexts/Moat/Musician/infrastructure/persistence/PrismaMusicianRepository.js';
import { MusicianUsernameAlreadyExistsException } from '@Contexts/Moat/Musician/domain/exception/MusicianUsernameAlreadyExistsException.js';
import { MusicianUserAlreadyHasProfileException } from '@Contexts/Moat/Musician/domain/exception/MusicianUserAlreadyHasProfileException.js';
import { MusicianMother } from '../../domain/MusicianMother.js';
import { MusicianIdMother } from '../../domain/MusicianIdMother.js';
import { MusicianUserIdMother } from '../../domain/MusicianUserIdMother.js';
import { MusicianUsernameMother } from '../../domain/MusicianUsernameMother.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const prisma = PrismaClientFactory.createClient();
describe('PrismaMusicianRepository', () => {
  let repository: PrismaMusicianRepository;

  beforeEach(async () => {
    repository = new PrismaMusicianRepository();
    await prisma.bandMember.deleteMany();
    await prisma.band.deleteMany();
    await prisma.musician.deleteMany();
    await prisma.user.deleteMany(); // Since user is a required relation
  });

  describe('save', () => {
    it('should save a valid musician', async () => {
      const musician = MusicianMother.random();

      // We need to create the User first because Musician has a FK to User
      await prisma.user.create({
        data: {
          id: musician.userId.value,
          email: `${musician.userId.value}@test.com`,
          password: 'password'
        }
      });

      await repository.save(musician);

      const dbMusician = await prisma.musician.findUnique({
        where: { id: musician.id.value }
      });
      expect(dbMusician?.userId).toBe(musician.userId.value);
      expect(dbMusician?.username).toBe(musician.username.value);
    });

    it('should translate Prisma P2002 for duplicate username', async () => {
      const existing = MusicianMother.random();
      const duplicatedUsername = MusicianMother.create({
        username: MusicianUsernameMother.create(existing.username.value)
      });

      await prisma.user.createMany({
        data: [
          {
            id: existing.userId.value,
            email: `${existing.userId.value}@test.com`,
            password: 'password'
          },
          {
            id: duplicatedUsername.userId.value,
            email: `${duplicatedUsername.userId.value}@test.com`,
            password: 'password'
          }
        ]
      });

      await repository.save(existing);

      await expect(repository.save(duplicatedUsername)).rejects.toThrow(
        new MusicianUsernameAlreadyExistsException(duplicatedUsername.username.value)
      );
    });

    it('should translate Prisma P2002 for duplicate userId', async () => {
      const existing = MusicianMother.random();
      const duplicatedUserId = MusicianMother.create({
        userId: MusicianUserIdMother.create(existing.userId.value)
      });

      await prisma.user.createMany({
        data: [
          {
            id: existing.userId.value,
            email: `${existing.userId.value}@test.com`,
            password: 'password'
          },
          {
            id: duplicatedUserId.id.value,
            email: `${duplicatedUserId.id.value}@test.com`,
            password: 'password'
          }
        ]
      });

      await repository.save(existing);

      await expect(repository.save(duplicatedUserId)).rejects.toThrow(
        new MusicianUserAlreadyHasProfileException(duplicatedUserId.userId.value)
      );
    });
  });

  describe('search', () => {
    it('should return null when musician does not exist', async () => {
      const musician = await repository.search(MusicianIdMother.random());
      expect(musician).toBeNull();
    });

    it('should find an existing musician', async () => {
      const expected = MusicianMother.random();

      await prisma.user.create({
        data: {
          id: expected.userId.value,
          email: `${expected.userId.value}@test.com`,
          password: 'password'
        }
      });

      await repository.save(expected);

      const result = await repository.search(expected.id);
      expect(result).not.toBeNull();
      expect(result?.toPrimitives()).toEqual(expected.toPrimitives());
    });
  });

  describe('searchByUserId', () => {
    it('should return null when musician does not exist by userId', async () => {
      const musician = await repository.searchByUserId(MusicianUserIdMother.random());
      expect(musician).toBeNull();
    });

    it('should find an existing musician by userId', async () => {
      const expected = MusicianMother.random();

      await prisma.user.create({
        data: {
          id: expected.userId.value,
          email: `${expected.userId.value}@test.com`,
          password: 'password'
        }
      });

      await repository.save(expected);

      const result = await repository.searchByUserId(expected.userId);
      expect(result).not.toBeNull();
      expect(result?.toPrimitives()).toEqual(expected.toPrimitives());
    });
  });
});
