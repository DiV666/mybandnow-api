import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongInstrumentUploadStatusUpdater } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadStatusUpdater.js';
import { SongInstrumentUploadPersistenceRepository } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadMother } from '../../domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadNotExistException } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/exception/SongInstrumentUploadNotExistException.js';
import { SongInstrumentUploadStatusMother } from '../../domain/SongInstrumentUploadStatusMother.js';
import { SongInstrumentPersistenceRepository } from '../../../../../../../src/Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrument } from '../../../../../../../src/Contexts/Moat/SongInstrument/domain/SongInstrument.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

describe('SongInstrumentUploadStatusUpdater', () => {
  let repository: SongInstrumentUploadPersistenceRepository;
  let songInstrumentRepository: SongInstrumentPersistenceRepository;
  let eventBus: EventBus;
  let updater: SongInstrumentUploadStatusUpdater;

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
    eventBus = {
      publish: vi.fn()
    } as unknown as EventBus;
    updater = new SongInstrumentUploadStatusUpdater(repository, songInstrumentRepository, eventBus);
  });

  it('should update a songInstrumentUpload status to completed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
    });
    const completionData = {
      url: `tracks/${songInstrumentUpload.id.value}.mp4`,
      duration: 120,
      size: 100000
    };
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.COMPLETED,
      completionData
    });

    expect(repository.search).toHaveBeenCalledWith(songInstrumentUpload.id);
    expect(repository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'moat.song_instrument_upload.completed',
        aggregateId: songInstrumentUpload.id.value,
        attributes: expect.objectContaining({
          id: songInstrumentUpload.id.value,
          songInstrumentId: songInstrumentUpload.songInstrumentId.value,
          url: completionData.url,
          duration: completionData.duration,
          size: completionData.size
        })
      })
    ]);
  });

  it('should update a processing songInstrumentUpload status to failed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.FAILED
    });

    expect(repository.search).toHaveBeenCalledWith(songInstrumentUpload.id);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.FAILED })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'moat.song_instrument_upload.failed',
        aggregateId: songInstrumentUpload.id.value,
        id: songInstrumentUpload.id.value
      })
    ]);
  });

  it('should ignore a stale status update when the upload attempt is no longer active', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, '6ad9912f-aa18-45b0-b109-e1f01b5978f8')
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.COMPLETED,
      completionData: {
        url: `tracks/${songInstrumentUpload.id.value}.mp4`,
        duration: 120,
        size: 100000
      }
    });

    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should ignore a failed status update when the songInstrumentUpload is already completed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.COMPLETED)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.FAILED
    });

    expect(repository.search).toHaveBeenCalledWith(songInstrumentUpload.id);
    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should ignore a failed status update when the songInstrumentUpload is already failed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.FAILED)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.FAILED
    });

    expect(repository.search).toHaveBeenCalledWith(songInstrumentUpload.id);
    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should ignore a completed status update when the songInstrumentUpload is already completed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.COMPLETED)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.COMPLETED,
      completionData: {
        url: `tracks/${songInstrumentUpload.id.value}.mp4`,
        duration: 120,
        size: 100000
      }
    });

    expect(repository.search).toHaveBeenCalledWith(songInstrumentUpload.id);
    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should ignore a completed status update when the songInstrumentUpload is already failed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.FAILED)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await updater.run({
      id: songInstrumentUpload.id.value,
      status: SongInstrumentUploadStatusValues.COMPLETED,
      completionData: {
        url: `tracks/${songInstrumentUpload.id.value}.mp4`,
        duration: 120,
        size: 100000
      }
    });

    expect(repository.search).toHaveBeenCalledWith(songInstrumentUpload.id);
    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw an error if completion payload is missing for a completed songInstrumentUpload', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
    });
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(
      createSongInstrument(songInstrumentUpload.songInstrumentId.value, songInstrumentUpload.id.value)
    );

    await expect(
      updater.run({ id: songInstrumentUpload.id.value, status: SongInstrumentUploadStatusValues.COMPLETED })
    ).rejects.toThrow('SongInstrumentUpload completion requires url, duration, and size');
  });

  it('should throw an error if songInstrumentUpload does not exist', async () => {
    vi.mocked(repository.search).mockResolvedValue(null);
    const nonExistentId = SongInstrumentUploadMother.create().id.value;

    await expect(
      updater.run({ id: nonExistentId, status: SongInstrumentUploadStatusValues.COMPLETED })
    ).rejects.toThrow(SongInstrumentUploadNotExistException);
  });
});

function createSongInstrument(songInstrumentId: string, activeUploadAttemptId: string | null): SongInstrument {
  return SongInstrument.fromPrimitives({
    id: songInstrumentId,
    songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
    musicianId: '9416de0f-6513-4adf-ab75-ff075950179b',
    instrumentType: 'guitar',
    name: 'Lead Guitar',
    createdAt: new Date('2026-07-12T12:00:00.000Z'),
    activeUploadAttemptId
  });
}
