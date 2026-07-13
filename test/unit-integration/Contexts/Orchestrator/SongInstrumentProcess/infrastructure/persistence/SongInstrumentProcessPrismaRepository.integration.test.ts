import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { SongInstrumentProcessPersistenceRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/repository/SongInstrumentProcessPersistenceRepository.js';
import { SongInstrumentProcess } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcess.js';
import { SongInstrumentProcessId } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/SongInstrumentProcessId.js';
import { GcsPath } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/GcsPath.js';
import { FileSize } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/FileSize.js';
import { Codec } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/Codec.js';
import { FfprobeLog } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/value-object/FfprobeLog.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const persistenceRepository: SongInstrumentProcessPersistenceRepository = container.get(
  'Orchestrator.SongInstrumentProcess.SongInstrumentProcessPersistenceRepository'
);
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const prisma = PrismaClientFactory.createClient();

describe('SongInstrumentProcessPrismaRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  describe('#save', () => {
    it('should use SongInstrumentProcess as the physical table name', async () => {
      // Act
      const tables = await prisma.$queryRaw<Array<{ tableName: string }>>`
        SELECT table_name AS "tableName"
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'SongInstrumentProcess'
      `;

      // Assert
      expect(tables).toEqual([{ tableName: 'SongInstrumentProcess' }]);
    });

    it('should persist and load a completed track process', async () => {
      // Arrange
      const expectedModel = SongInstrumentProcess.complete(
        new SongInstrumentProcessId('12345678-1234-4234-8234-123456789011'),
        new GcsPath('tracks/12345678-1234-4234-8234-123456789011.mp4'),
        new FileSize(100000),
        new Codec('h264'),
        new FfprobeLog({ codec: 'h264', durationInSeconds: 120, width: 1920, height: 1080 })
      );

      // Act
      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.search(expectedModel.id);
      const persistedSongInstrumentProcess = await prisma.songInstrumentProcess.findUnique({
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
      expect(persistedSongInstrumentProcess).toMatchObject({
        id: expectedModel.id.value,
        status: 'COMPLETED',
        gcsPath: expectedModel.gcsPath?.value,
        fileSize: expectedModel.fileSize?.value,
        codec: expectedModel.codec?.value
      });
    });

    it('should persist and load a failed track process with nullable output fields', async () => {
      // Arrange
      const expectedModel = SongInstrumentProcess.fail(
        new SongInstrumentProcessId('12345678-1234-4234-8234-123456789012'),
        'Invalid video'
      );

      // Act
      await persistenceRepository.save(expectedModel);

      const foundModel = await persistenceRepository.search(expectedModel.id);
      const persistedSongInstrumentProcess = await prisma.songInstrumentProcess.findUnique({
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
      expect(persistedSongInstrumentProcess).toMatchObject({
        id: expectedModel.id.value,
        status: 'FAILED',
        gcsPath: null,
        fileSize: null,
        codec: null
      });
    });

    it('should preserve a zero file size when reloading a completed track process', async () => {
      // Arrange
      const expectedModel = SongInstrumentProcess.complete(
        new SongInstrumentProcessId('12345678-1234-4234-8234-123456789013'),
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
