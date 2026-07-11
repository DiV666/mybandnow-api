import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { TrackProcessPersistenceRepository } from '@Contexts/Orchestrator/TrackProcess/domain/repository/TrackProcessPersistenceRepository.js';
import { TrackProcess } from '@Contexts/Orchestrator/TrackProcess/domain/TrackProcess.js';
import { TrackProcessId } from '@Contexts/Orchestrator/TrackProcess/domain/value-object/TrackProcessId.js';
import { GcsPath } from '@Contexts/Orchestrator/TrackProcess/domain/value-object/GcsPath.js';
import { FileSize } from '@Contexts/Orchestrator/TrackProcess/domain/value-object/FileSize.js';
import { Codec } from '@Contexts/Orchestrator/TrackProcess/domain/value-object/Codec.js';
import { FfprobeLog } from '@Contexts/Orchestrator/TrackProcess/domain/value-object/FfprobeLog.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const persistenceRepository: TrackProcessPersistenceRepository = container.get(
  'Orchestrator.TrackProcess.TrackProcessPersistenceRepository'
);
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const prisma = PrismaClientFactory.createClient();

describe('TrackProcessPrismaRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  describe('#save', () => {
    it('should persist and load a completed track process', async () => {
      // Arrange
      const expectedModel = TrackProcess.complete(
        new TrackProcessId('12345678-1234-4234-8234-123456789011'),
        new GcsPath('tracks/12345678-1234-4234-8234-123456789011.mp4'),
        new FileSize(100000),
        new Codec('h264'),
        new FfprobeLog({ codec: 'h264', durationInSeconds: 120, width: 1920, height: 1080 })
      );

      // Act
      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.search(expectedModel.id);
      const persistedTrackProcess = await prisma.trackProcess.findUnique({
        where: { id: expectedModel.id.value }
      });

      // Assert
      expect(foundModel).not.toBeNull();
      expect(foundModel?.toPrimitives()).toMatchObject({
        id: expectedModel.id.value,
        status: 'COMPLETED',
        gcsPath: expectedModel.gcsPath?.value,
        fileSize: expectedModel.fileSize?.value,
        codec: expectedModel.codec?.value,
        ffprobeLog: {
          codec: 'h264',
          durationInSeconds: 120,
          width: 1920,
          height: 1080
        }
      });
      expect(persistedTrackProcess).toMatchObject({
        id: expectedModel.id.value,
        status: 'COMPLETED',
        gcsPath: expectedModel.gcsPath?.value,
        fileSize: expectedModel.fileSize?.value,
        codec: expectedModel.codec?.value
      });
    });

    it('should persist and load a failed track process with nullable output fields', async () => {
      // Arrange
      const expectedModel = TrackProcess.fail(
        new TrackProcessId('12345678-1234-4234-8234-123456789012'),
        'Invalid video'
      );

      // Act
      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.search(expectedModel.id);
      const persistedTrackProcess = await prisma.trackProcess.findUnique({
        where: { id: expectedModel.id.value }
      });

      // Assert
      expect(foundModel).not.toBeNull();
      expect(foundModel?.toPrimitives()).toMatchObject({
        id: expectedModel.id.value,
        status: 'FAILED',
        gcsPath: null,
        fileSize: null,
        codec: null,
        ffprobeLog: { error: 'Invalid video' }
      });
      expect(persistedTrackProcess).toMatchObject({
        id: expectedModel.id.value,
        status: 'FAILED',
        gcsPath: null,
        fileSize: null,
        codec: null
      });
    });

    it('should preserve a zero file size when reloading a completed track process', async () => {
      // Arrange
      const expectedModel = TrackProcess.complete(
        new TrackProcessId('12345678-1234-4234-8234-123456789013'),
        new GcsPath('tracks/12345678-1234-4234-8234-123456789013.mp4'),
        new FileSize(0),
        new Codec('h264'),
        new FfprobeLog({ codec: 'h264', durationInSeconds: 0, width: 0, height: 0 })
      );

      // Act
      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.search(expectedModel.id);

      // Assert
      expect(foundModel).not.toBeNull();
      expect(foundModel?.toPrimitives()).toMatchObject({
        id: expectedModel.id.value,
        status: 'COMPLETED',
        gcsPath: expectedModel.gcsPath?.value,
        fileSize: 0,
        codec: expectedModel.codec?.value,
        ffprobeLog: {
          codec: 'h264',
          durationInSeconds: 0,
          width: 0,
          height: 0
        }
      });
    });
  });
});
