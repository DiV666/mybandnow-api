import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { SongAuthorizationRepository } from '@Contexts/Moat/Song/domain/repository/SongAuthorizationRepository.js';
import { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import { SongBandId } from '@Contexts/Moat/Song/domain/value-object/SongBandId.js';
import { SongId } from '@Contexts/Moat/Song/domain/value-object/SongId.js';
import { SongMusicianId } from '@Contexts/Moat/Song/domain/value-object/SongMusicianId.js';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { SongMother } from '../../domain/SongMother.js';
import { SongExistException } from '@Contexts/Moat/Song/domain/exception/SongExistException.js';
import { SongPersistenceRepositoryTestCase } from './SongPersistenceRepositoryTestCase.js';

const persistenceRepository: SongPersistenceRepository = container.get('Moat.Song.SongRepository');
const authorizationRepository: SongAuthorizationRepository = container.get('Moat.Song.SongRepository');
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const prisma = PrismaClientFactory.createClient();
const testCase = new SongPersistenceRepositoryTestCase();

async function createMusician(id: string, username: string): Promise<void> {
  await prisma.user.create({
    data: {
      id,
      email: `${id}@test.com`,
      password: 'password'
    }
  });

  await prisma.musician.create({
    data: {
      id,
      userId: id,
      realName: username,
      username
    }
  });
}

describe('SongPersistenceRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  async function createBandDependencies(bandId: string, ownerId: string, memberId: string): Promise<void> {
    await createMusician(ownerId, `owner_${ownerId.replace(/-/g, '')}`);

    if (memberId !== ownerId) {
      await createMusician(memberId, `member_${memberId.replace(/-/g, '')}`);
    }

    await prisma.band.upsert({
      where: { id: bandId },
      update: {
        name: 'Repository Band',
        ownerId
      },
      create: {
        id: bandId,
        name: 'Repository Band',
        ownerId
      }
    });

    if (memberId !== ownerId) {
      await prisma.bandMember.upsert({
        where: {
          musicianId_bandId: {
            musicianId: memberId,
            bandId
          }
        },
        update: {
          role: 'MEMBER'
        },
        create: {
          id: `member-${bandId}`,
          musicianId: memberId,
          bandId,
          role: 'MEMBER'
        }
      });
    }
  }

  describe('#search', () => {
    it('should return an existing song by id', async () => {
      const expectedModel = SongMother.create();
      const memberId = '123e4567-e89b-12d3-a456-426614174100';
      await createBandDependencies(expectedModel.bandId.value, memberId, memberId);
      await persistenceRepository.save(expectedModel);

      const model = await persistenceRepository.search(expectedModel.id);
      testCase.assertSimilar(model, expectedModel);
    });

    it('should not return a non-existing song by id', async () => {
      const found = await persistenceRepository.search(new SongId('123e4567-e89b-12d3-a456-426614174101'));
      expect(found).toBeNull();
    });
  });

  describe('#save', () => {
    it('should save a song with its original videoclip url without creating a videoclip', async () => {
      const song = SongMother.random();
      const ownerId = '123e4567-e89b-12d3-a456-426614174102';
      const memberId = '123e4567-e89b-12d3-a456-426614174103';

      await createBandDependencies(song.bandId.value, ownerId, memberId);
      await persistenceRepository.save(song);

      const savedSong = await persistenceRepository.search(song.id);
      const persistedSong = (await prisma.song.findUnique({
        where: { id: song.id.value }
      })) as ({ originalVideoclipUrl: string } & { id: string }) | null;
      const videoclip = await prisma.videoclip.findUnique({ where: { songId: song.id.value } });

      expect(savedSong).toBeDefined();
      expect(persistedSong?.originalVideoclipUrl).toBe(song.originalVideoclipUrl.value);
      expect(videoclip).toBeNull();
    });

    it('should reject duplicate song ids without overwriting the existing row', async () => {
      const existingSong = SongMother.random();
      const duplicateSong = SongMother.create({
        id: existingSong.id,
        bandId: existingSong.bandId
      });
      const ownerId = '123e4567-e89b-12d3-a456-426614174120';
      const memberId = '123e4567-e89b-12d3-a456-426614174121';

      await createBandDependencies(existingSong.bandId.value, ownerId, memberId);
      await persistenceRepository.save(existingSong);

      await expect(persistenceRepository.save(duplicateSong)).rejects.toThrow(
        new SongExistException(existingSong.id.value)
      );

      const persistedSong = await persistenceRepository.search(existingSong.id);
      testCase.assertSimilar(persistedSong, existingSong);
    });
  });

  describe('#searchByBandId and #countByBandId', () => {
    it('should return the songs of a band with the matching total', async () => {
      const bandId = '123e4567-e89b-12d3-a456-426614174111';
      const ownerId = '123e4567-e89b-12d3-a456-426614174112';
      const memberId = '123e4567-e89b-12d3-a456-426614174113';
      const anotherBandOwnerId = '123e4567-e89b-12d3-a456-426614174118';
      const anotherBandMemberId = '123e4567-e89b-12d3-a456-426614174119';
      const firstSong = SongMother.create({
        id: new SongId('123e4567-e89b-12d3-a456-426614174114'),
        bandId: new SongBandId(bandId)
      });
      const secondSong = SongMother.create({
        id: new SongId('123e4567-e89b-12d3-a456-426614174115'),
        bandId: new SongBandId(bandId)
      });
      const songFromAnotherBand = SongMother.create({
        id: new SongId('123e4567-e89b-12d3-a456-426614174116'),
        bandId: new SongBandId('123e4567-e89b-12d3-a456-426614174117')
      });

      await createBandDependencies(bandId, ownerId, memberId);
      await createBandDependencies(songFromAnotherBand.bandId.value, anotherBandOwnerId, anotherBandMemberId);
      await persistenceRepository.save(firstSong);
      await persistenceRepository.save(secondSong);
      await persistenceRepository.save(songFromAnotherBand);

      const songs = await persistenceRepository.searchByBandId(new SongBandId(bandId));
      const total = await persistenceRepository.countByBandId(new SongBandId(bandId));

      expect(songs.map((song) => song.id.value)).toEqual([firstSong.id.value, secondSong.id.value]);
      expect(total).toBe(2);
    });
  });

  describe('#isBandMember', () => {
    it('should return true for an existing band member', async () => {
      const bandId = '123e4567-e89b-12d3-a456-426614174104';
      const ownerId = '123e4567-e89b-12d3-a456-426614174105';
      const memberId = '123e4567-e89b-12d3-a456-426614174106';
      await createBandDependencies(bandId, ownerId, memberId);

      const isMember = await authorizationRepository.isBandMember(new SongBandId(bandId), new SongMusicianId(memberId));

      expect(isMember).toBe(true);
    });

    it('should return false for a musician outside the band', async () => {
      const bandId = '123e4567-e89b-12d3-a456-426614174107';
      const ownerId = '123e4567-e89b-12d3-a456-426614174108';
      const memberId = '123e4567-e89b-12d3-a456-426614174109';
      const outsiderId = '123e4567-e89b-12d3-a456-426614174110';
      await createBandDependencies(bandId, ownerId, memberId);
      await createMusician(outsiderId, 'outsider_user');

      const isMember = await authorizationRepository.isBandMember(
        new SongBandId(bandId),
        new SongMusicianId(outsiderId)
      );

      expect(isMember).toBe(false);
    });
  });
});
