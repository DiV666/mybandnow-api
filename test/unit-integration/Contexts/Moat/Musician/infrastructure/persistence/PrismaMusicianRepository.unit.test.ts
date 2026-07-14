import { describe, expect, it, vi } from 'vitest';
import { MusicianUserAlreadyHasProfileException } from '@Contexts/Moat/Musician/domain/exception/MusicianUserAlreadyHasProfileException.js';
import { MusicianUsernameAlreadyExistsException } from '@Contexts/Moat/Musician/domain/exception/MusicianUsernameAlreadyExistsException.js';
import { MusicianMother } from '../../domain/MusicianMother.js';

const repositoryModulePath = '@Contexts/Moat/Musician/infrastructure/persistence/PrismaMusicianRepository.js';
const prismaClientFactoryModulePath = '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

describe('PrismaMusicianRepository', () => {
  it('translates duplicate userId persistence errors using the explicit Prisma target before fallback metadata', async () => {
    // Arrange
    const musician = MusicianMother.random();
    const upsert = vi.fn().mockRejectedValue({
      code: 'P2002',
      meta: {
        target: ['userId'],
        driverAdapterError: {
          cause: {
            constraint: {
              fields: ['username', 'userId']
            }
          }
        }
      }
    });

    const repository = await loadRepository({ upsert });

    // Act + Assert
    await expect(repository.save(musician)).rejects.toThrow(
      new MusicianUserAlreadyHasProfileException(musician.userId.value)
    );
  });

  it('still translates duplicate username persistence errors when Prisma points to username directly', async () => {
    // Arrange
    const musician = MusicianMother.random();
    const upsert = vi.fn().mockRejectedValue({
      code: 'P2002',
      meta: {
        target: ['username']
      }
    });

    const repository = await loadRepository({ upsert });

    // Act + Assert
    await expect(repository.save(musician)).rejects.toThrow(
      new MusicianUsernameAlreadyExistsException(musician.username.value)
    );
  });
});

async function loadRepository(prismaMusicianClient: { upsert: ReturnType<typeof vi.fn> }) {
  vi.resetModules();
  vi.doMock(prismaClientFactoryModulePath, () => ({
    PrismaClientFactory: {
      createClient: () => ({
        musician: prismaMusicianClient
      })
    }
  }));

  const { PrismaMusicianRepository } = await import(repositoryModulePath);

  return new PrismaMusicianRepository();
}
