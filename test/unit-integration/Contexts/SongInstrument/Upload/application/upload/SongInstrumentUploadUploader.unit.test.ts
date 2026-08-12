import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongInstrumentUploadUploader } from '../../../../../../../src/Contexts/SongInstrument/Upload/application/upload/SongInstrumentUploadUploader.js';
import { SongInstrumentUploadPersistenceRepository } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadMother } from '../../domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusMother } from '../../domain/SongInstrumentUploadStatusMother.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { SongInstrumentPersistenceRepository } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrument } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentNotExistException } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { FakeClock } from '../../../../../../utils/mocks/FakeClock.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadStorageRepository } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/repository/SongInstrumentUploadStorageRepository.js';
import type Logger from '@Contexts/Shared/domain/Logger.js';

describe('SongInstrumentUploadUploader', () => {
  let repository: SongInstrumentUploadPersistenceRepository;
  let songInstrumentRepository: SongInstrumentPersistenceRepository;
  let storageRepository: SongInstrumentUploadStorageRepository;
  let logger: Logger;
  let eventBus: EventBus;
  let clock: FakeClock;
  let uploader: SongInstrumentUploadUploader;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      saveWithSongInstrument: vi.fn(),
      search: vi.fn(),
      searchBySongInstrumentId: vi.fn(),
      remove: vi.fn()
    } as SongInstrumentUploadPersistenceRepository;
    songInstrumentRepository = {
      save: vi.fn(),
      search: vi.fn(),
      matching: vi.fn(),
      matchingCount: vi.fn()
    } as SongInstrumentPersistenceRepository;
    storageRepository = {
      uploadFile: vi.fn().mockResolvedValue(undefined),
      deleteFile: vi.fn().mockResolvedValue(undefined)
    } as SongInstrumentUploadStorageRepository;
    logger = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn()
    } as unknown as Logger;
    eventBus = {
      publish: vi.fn()
    } as unknown as EventBus;
    clock = new FakeClock(new Date('2026-07-12T12:00:00.000Z'));
    uploader = new SongInstrumentUploadUploader(
      repository,
      songInstrumentRepository,
      storageRepository,
      logger,
      eventBus,
      clock
    );
  });

  it('creates an internal songInstrumentUpload from the song instrument context when one does not exist yet', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b',
      instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000001'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.searchBySongInstrumentId).mockResolvedValue(null);

    await uploader.run({
      songId: songInstrument.songId.value,
      songInstrumentId: songInstrument.id.value,
      musicianId: songInstrument.musicianId.value,
      tempFilePath: '/srv/uploads/file.mp4'
    });

    expect(songInstrumentRepository.search).toHaveBeenCalledWith(songInstrument.id);
    expect(repository.searchBySongInstrumentId).not.toHaveBeenCalled();
    expect(storageRepository.uploadFile).toHaveBeenCalledWith(
      '/srv/uploads/file.mp4',
      expect.stringMatching(isSongInstrumentUploadPath())
    );

    expect(repository.saveWithSongInstrument).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.PROCESSING }),
        songInstrumentId: expect.objectContaining({ value: songInstrument.id.value }),
        songId: expect.objectContaining({ value: songInstrument.songId.value })
      }),
      expect.objectContaining({
        id: expect.objectContaining({ value: songInstrument.id.value }),
        activeUploadAttemptId: expect.objectContaining({ value: expect.any(String) })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'song_instrument.1.upload.requested',
        aggregateId: expect.any(String),
        attributes: expect.objectContaining({
          attemptId: expect.any(String),
          fileReference: expect.stringMatching(isSongInstrumentUploadPath())
        })
      })
    ]);
  });

  it('creates a new upload attempt instead of reusing the previous one on retry', async () => {
    const songInstrument = createSongInstrument({
      id: '6b36e6e7-f31e-49d2-af12-f2330fbb6c31',
      songId: '89e4c2fe-c859-4232-bf24-305cdb9f05f0',
      musicianId: '9b8c66f8-3aa7-4ced-b0f6-2e2bd50d6541'
    });
    const previousSongInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.FAILED),
      songInstrumentId: songInstrument.id,
      songId: songInstrument.songId
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);

    await uploader.run({
      songId: songInstrument.songId.value,
      songInstrumentId: songInstrument.id.value,
      musicianId: songInstrument.musicianId.value,
      tempFilePath: '/srv/uploads/retry-file.mp4'
    });

    expect(repository.searchBySongInstrumentId).not.toHaveBeenCalled();
    expect(storageRepository.uploadFile).toHaveBeenCalledWith(
      '/srv/uploads/retry-file.mp4',
      expect.stringMatching(isSongInstrumentUploadPath())
    );

    expect(repository.saveWithSongInstrument).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.not.objectContaining({ value: previousSongInstrumentUpload.id.value }),
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.PROCESSING })
      }),
      expect.objectContaining({
        activeUploadAttemptId: expect.objectContaining({ value: expect.any(String) })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'song_instrument.1.upload.requested',
        aggregateId: expect.any(String),
        attributes: expect.objectContaining({
          attemptId: expect.any(String),
          fileReference: expect.stringMatching(isSongInstrumentUploadPath())
        })
      })
    ]);
  });

  it('rolls back the durable upload when persistence fails after GCS handoff', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.saveWithSongInstrument).mockRejectedValue(new Error('save failed'));

    await expect(
      uploader.run({
        songId: songInstrument.songId.value,
        songInstrumentId: songInstrument.id.value,
        musicianId: songInstrument.musicianId.value,
        tempFilePath: '/srv/uploads/file.mp4'
      })
    ).rejects.toThrow('save failed');

    expect(storageRepository.deleteFile).toHaveBeenCalledWith(expect.stringMatching(isSongInstrumentUploadPath()));
  });

  it('keeps the durable upload when publish fails after persistence succeeded', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked((eventBus as EventBus).publish).mockRejectedValue(new Error('publish failed'));

    await expect(
      uploader.run({
        songId: songInstrument.songId.value,
        songInstrumentId: songInstrument.id.value,
        musicianId: songInstrument.musicianId.value,
        tempFilePath: '/srv/uploads/file.mp4'
      })
    ).rejects.toThrow('publish failed');

    expect(storageRepository.deleteFile).not.toHaveBeenCalled();
  });

  it('logs the rollback failure when durable cleanup cannot be completed', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.saveWithSongInstrument).mockRejectedValue(new Error('save failed'));
    vi.mocked(storageRepository.deleteFile).mockRejectedValue(new Error('cleanup failed'));

    await expect(
      uploader.run({
        songId: songInstrument.songId.value,
        songInstrumentId: songInstrument.id.value,
        musicianId: songInstrument.musicianId.value,
        tempFilePath: '/srv/uploads/file.mp4'
      })
    ).rejects.toThrow('save failed');

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'cleanup failed' }),
      expect.stringContaining('Failed to roll back durable upload')
    );
  });

  it('throws not found when the song instrument does not exist', async () => {
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(null);

    await expect(
      uploader.run({
        songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
        songInstrumentId: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
        musicianId: '9416de0f-6513-4adf-ab75-ff075950179b',
        tempFilePath: '/srv/uploads/file.mp4'
      })
    ).rejects.toThrow(SongInstrumentNotExistException);
  });

  it('throws forbidden when the authenticated musician is not assigned to the song instrument', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);

    await expect(
      uploader.run({
        songId: songInstrument.songId.value,
        songInstrumentId: songInstrument.id.value,
        musicianId: '3ae51c35-8b20-4e86-bff1-a2f7af8ed649',
        tempFilePath: '/srv/uploads/file.mp4'
      })
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws not found when the song instrument does not belong to the song in the path', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);

    await expect(
      uploader.run({
        songId: '54dbbe97-77ec-4787-99a1-c085e952cd70',
        songInstrumentId: songInstrument.id.value,
        musicianId: songInstrument.musicianId.value,
        tempFilePath: '/srv/uploads/file.mp4'
      })
    ).rejects.toThrow(SongInstrumentNotExistException);
  });
});

function isSongInstrumentUploadPath(): RegExp {
  return /^song-instrument-uploads\/[^/]+\/[^/]+\/[^/]+\.mp4$/;
}

function createSongInstrument(params: {
  id: string;
  songId: string;
  musicianId: string;
  instrumentId?: string;
}): SongInstrument {
  return SongInstrument.fromPrimitives({
    id: params.id,
    songId: params.songId,
    musicianId: params.musicianId,
    instrumentId: params.instrumentId ?? '0e7a0d5f-3d2a-4bc1-8d4d-100000000001',
    name: 'Lead Guitar',
    createdAt: new Date('2026-07-12T12:00:00.000Z'),
    activeUploadAttemptId: null
  });
}
