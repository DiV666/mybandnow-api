import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '../../../../../apps/mybandnow/backend/config/dependency-injection/index.js';
import { VideoclipPersistenceRepository } from '../../../../../../src/Contexts/Videoclip/domain/repository/VideoclipPersistenceRepository.js';
import { EnvironmentArranger } from '../../../../../utils/arranger/EnvironmentArranger.js';
import { VideoclipMother } from '../../domain/VideoclipMother.js';
import { VideoclipPersistenceRepositoryTestCase } from './VideoclipPersistenceRepositoryTestCase.js';
import { PrismaClientFactory } from '../../../../../../src/Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const persistenceRepository: VideoclipPersistenceRepository = container.get('Videoclip.VideoclipRepository');
const environmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const testCase = new VideoclipPersistenceRepositoryTestCase();
const prisma = PrismaClientFactory.createClient();

async function seedSong(songId: string) {
  const userId = '123e4567-e89b-12d3-a456-426614174001';
  const musicianId = '123e4567-e89b-12d3-a456-426614174002';
  const bandId = '123e4567-e89b-12d3-a456-426614174000';
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email: 'test@example.com', password: 'password', createdAt: new Date() },
    update: {}
  });
  await prisma.musician.upsert({
    where: { id: musicianId },
    create: { id: musicianId, userId, username: 'testuser', realName: 'Test User' },
    update: {}
  });
  await prisma.band.upsert({
    where: { id: bandId },
    create: { id: bandId, name: 'Band', ownerId: musicianId, createdAt: new Date(), updatedAt: new Date() },
    update: {}
  });
  await prisma.song.upsert({
    where: { id: songId },
    create: {
      id: songId,
      title: 'Song',
      bandId,
      originalVideoclipUrl: `https://cdn.example.com/songs/${songId}/original.mp4`
    },
    update: {}
  });
}

describe('VideoclipPersistenceRepository', () => {
  beforeEach(async () => {
    await (await environmentArranger).arrange();
  });

  afterAll(async () => {
    await (await environmentArranger).clean();
    await (await environmentArranger).close();
  });
  describe('#search', () => {
    it('should return an existing videoclip by id', async () => {
      const expectedModel = VideoclipMother.create();
      await seedSong(expectedModel.songId.value);
      await persistenceRepository.save(expectedModel);

      const model = await persistenceRepository.search(expectedModel.id);
      testCase.assertSimilar(model, expectedModel);
    });

    it('should not return a non-existing videoclip by id', async () => {
      const model = VideoclipMother.create();
      const found = await persistenceRepository.search(model.id);
      expect(found).toBeFalsy();
    });
  });
  describe('#create', () => {
    it('should save a videoclip', async () => {
      const model = VideoclipMother.random();
      await seedSong(model.songId.value);
      await persistenceRepository.save(model);
      const savedModel = await persistenceRepository.search(model.id);
      expect(savedModel).toBeDefined();
    });
  });
});
