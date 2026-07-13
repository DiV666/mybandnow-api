import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongInstrumentUploadStatusUpdater } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadStatusUpdater.js';
import { SongInstrumentUploadPersistenceRepository } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadMother } from '../../domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadNotExistException } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/exception/SongInstrumentUploadNotExistException.js';

import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

describe('SongInstrumentUploadStatusUpdater', () => {
  let repository: SongInstrumentUploadPersistenceRepository;
  let eventBus: EventBus;
  let updater: SongInstrumentUploadStatusUpdater;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      search: vi.fn(),
      searchBySongInstrumentId: vi.fn(),
      remove: vi.fn()
    } as SongInstrumentUploadPersistenceRepository;
    eventBus = {
      publish: vi.fn()
    } as unknown as EventBus;
    updater = new SongInstrumentUploadStatusUpdater(repository, eventBus);
  });

  it('should update a songInstrumentUpload status to completed', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create();
    const completionData = {
      url: `tracks/${songInstrumentUpload.id.value}.mp4`,
      duration: 120,
      size: 100000
    };
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);

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

  it('should throw an error if completion payload is missing for a completed songInstrumentUpload', async () => {
    const songInstrumentUpload = SongInstrumentUploadMother.create();
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);

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
