import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { VideoclipProcessPersistenceRepository } from '@Contexts/Orchestrator/VideoclipProcess/domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { VideoclipProcessSongId } from '@Contexts/Orchestrator/VideoclipProcess/domain/value-object/VideoclipProcessSongId.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const persistenceRepository: VideoclipProcessPersistenceRepository = container.get(
  'Orchestrator.VideoclipProcess.VideoclipProcessPersistenceRepository'
);
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const prisma = PrismaClientFactory.createClient();

async function createSong(songId: string): Promise<void> {
  const userId = songId.replace(/^./, '1');
  const musicianId = songId.replace(/^./, '2');
  const bandId = songId.replace(/^./, '3');

  await prisma.user.create({
    data: { id: userId, email: `${userId}@test.com`, password: 'password' }
  });

  await prisma.musician.create({
    data: {
      id: musicianId,
      userId,
      username: `videoclipprocess_${songId.replace(/-/g, '').substring(0, 8)}`,
      realName: 'Videoclip Process Musician',
      instruments: []
    }
  });

  await prisma.band.create({
    data: { id: bandId, name: 'Videoclip Process Band', ownerId: musicianId }
  });

  await prisma.song.create({
    data: {
      id: songId,
      title: 'Videoclip Process Song',
      bandId,
      originalVideoclipUrl: `https://cdn.example.com/songs/${songId}/original.mp4`
    }
  });
}

describe('VideoclipProcessPrismaRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  describe('#save', () => {
    it('should persist and load a requested videoclip process, and store the outbox event', async () => {
      const id = '12345678-1234-4234-8234-123456789011';
      const songId = '22345678-1234-4234-8234-123456789011';
      const songInstrumentId = '32345678-1234-4234-8234-123456789011';
      await createSong(songId);

      const expectedModel = VideoclipProcess.request(id, songId, [
        { songInstrumentId, videoUrl: 'gs://bucket/video.mp4' }
      ]);

      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.search(expectedModel.id);
      expect(foundModel).not.toBeNull();
      expect(foundModel?.toPrimitives()).toMatchObject({
        id,
        status: 'PENDING',
        songId,
        aiPayload: { instruments: [{ songInstrumentId, videoUrl: 'gs://bucket/video.mp4' }] },
        aiResponse: null,
        finalGcsPath: null
      });

      const outboxEvents = await prisma.outbox.findMany({ where: { aggregateId: id } });
      expect(outboxEvents).toHaveLength(1);
      expect(outboxEvents[0].eventName).toBe('orchestrator.1.videoclip_process.requested');
    });
  });

  describe('#searchActiveBySongId', () => {
    it('should return the process for the given songId when it is PENDING', async () => {
      const id = '12345678-1234-4234-8234-123456789012';
      const songId = '22345678-1234-4234-8234-123456789012';
      const songInstrumentId = '32345678-1234-4234-8234-123456789012';
      await createSong(songId);

      const expectedModel = VideoclipProcess.request(id, songId, [
        { songInstrumentId, videoUrl: 'gs://bucket/video.mp4' }
      ]);
      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.searchActiveBySongId(new VideoclipProcessSongId(songId));
      expect(foundModel?.id.value).toBe(id);
    });

    it('should return null when there is no process for the given songId', async () => {
      const songId = '22345678-1234-4234-8234-123456789013';
      await createSong(songId);

      const foundModel = await persistenceRepository.searchActiveBySongId(new VideoclipProcessSongId(songId));
      expect(foundModel).toBeNull();
    });

    it('should return null when the only process for the songId has reached a terminal status', async () => {
      const id = '12345678-1234-4234-8234-123456789014';
      const songId = '22345678-1234-4234-8234-123456789014';
      const songInstrumentId = '32345678-1234-4234-8234-123456789014';
      await createSong(songId);

      const terminalModel = VideoclipProcess.fromPrimitives({
        id,
        status: 'SUCCESS',
        songId,
        aiPayload: { instruments: [{ songInstrumentId, videoUrl: 'gs://bucket/video.mp4' }] },
        aiResponse: null,
        finalGcsPath: 'gs://bucket/final.mp4',
        startedAt: new Date(),
        updatedAt: new Date()
      });
      await persistenceRepository.save(terminalModel);

      const foundModel = await persistenceRepository.searchActiveBySongId(new VideoclipProcessSongId(songId));
      expect(foundModel).toBeNull();
    });

    it('should preserve every process as history and allow a new one after the previous reached a terminal status', async () => {
      const firstId = '12345678-1234-4234-8234-123456789015';
      const secondId = '12345678-1234-4234-8234-123456789016';
      const songId = '22345678-1234-4234-8234-123456789015';
      const songInstrumentId = '32345678-1234-4234-8234-123456789015';
      await createSong(songId);

      const failedModel = VideoclipProcess.fromPrimitives({
        id: firstId,
        status: 'FAILED',
        songId,
        aiPayload: { instruments: [{ songInstrumentId, videoUrl: 'gs://bucket/video.mp4' }] },
        aiResponse: null,
        finalGcsPath: null,
        startedAt: new Date(),
        updatedAt: new Date()
      });
      await persistenceRepository.save(failedModel);

      const newModel = VideoclipProcess.request(secondId, songId, [
        { songInstrumentId, videoUrl: 'gs://bucket/video.mp4' }
      ]);
      await persistenceRepository.save(newModel);

      const rows = await prisma.videoclipProcess.findMany({ where: { songId } });
      expect(rows).toHaveLength(2);

      const activeModel = await persistenceRepository.searchActiveBySongId(new VideoclipProcessSongId(songId));
      expect(activeModel?.id.value).toBe(secondId);
    });
  });
});
