import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongInstrumentUploadCanceller } from '../../../../../../../src/Contexts/SongInstrument/Upload/application/cancelUpload/SongInstrumentUploadCanceller.js';
import { SongInstrumentUploadCancelUploadCommand } from '../../../../../../../src/Contexts/SongInstrument/Upload/application/cancelUpload/SongInstrumentUploadCancelUploadCommand.js';
import { SongInstrumentUploadPersistenceRepository } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrument } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentNotExistException } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentUploadNotExistException } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/exception/SongInstrumentUploadNotExistException.js';
import { SongInstrumentUploadNotCancellableException } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/exception/SongInstrumentUploadNotCancellableException.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentUploadMother } from '../../domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadIdMother } from '../../domain/SongInstrumentUploadIdMother.js';
import { SongInstrumentUploadSongIdMother } from '../../domain/SongInstrumentUploadSongIdMother.js';
import { SongInstrumentUploadSongInstrumentIdMother } from '../../domain/SongInstrumentUploadSongInstrumentIdMother.js';
import { SongInstrumentUploadStatusMother } from '../../domain/SongInstrumentUploadStatusMother.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadStorageRepository } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/repository/SongInstrumentUploadStorageRepository.js';

describe('SongInstrumentUploadCanceller', () => {
  const songId = '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18';
  const songInstrumentId = '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3';
  const musicianId = '9416de0f-6513-4adf-ab75-ff075950179b';
  const uploadId = '3ae51c35-8b20-4e86-bff1-a2f7af8ed649';

  let repository: SongInstrumentUploadPersistenceRepository;
  let songInstrumentRepository: SongInstrumentPersistenceRepository;
  let storageRepository: SongInstrumentUploadStorageRepository;
  let canceller: SongInstrumentUploadCanceller;

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
      matchingCount: vi.fn(),
      reassignBandMemberInstruments: vi.fn()
    } as SongInstrumentPersistenceRepository;
    storageRepository = {
      getWriteSignedUrl: vi.fn(),
      fileExists: vi.fn(),
      deleteFile: vi.fn()
    } as SongInstrumentUploadStorageRepository;
    canceller = new SongInstrumentUploadCanceller(repository, songInstrumentRepository, storageRepository);
  });

  it('cancels a pending upload and deletes the file when it was already uploaded', async () => {
    const songInstrument = createSongInstrument({
      id: songInstrumentId,
      songId,
      musicianId,
      activeUploadAttemptId: uploadId
    });
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      id: SongInstrumentUploadIdMother.create(uploadId),
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PENDING),
      songId: SongInstrumentUploadSongIdMother.create(songId),
      songInstrumentId: SongInstrumentUploadSongInstrumentIdMother.create(songInstrumentId)
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(storageRepository.fileExists).mockResolvedValue(true);

    await canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId));

    const expectedFileReference = `song-instrument-uploads/${songId}/${songInstrumentId}/${uploadId}.mp4`;
    expect(storageRepository.fileExists).toHaveBeenCalledWith(expectedFileReference);
    expect(storageRepository.deleteFile).toHaveBeenCalledWith(expectedFileReference);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.CANCELLED })
      })
    );
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ activeUploadAttemptId: null })
    );
  });

  it('cancels a pending upload without deleting anything when the file was never uploaded', async () => {
    const songInstrument = createSongInstrument({
      id: songInstrumentId,
      songId,
      musicianId,
      activeUploadAttemptId: uploadId
    });
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      id: SongInstrumentUploadIdMother.create(uploadId),
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PENDING),
      songId: SongInstrumentUploadSongIdMother.create(songId),
      songInstrumentId: SongInstrumentUploadSongInstrumentIdMother.create(songInstrumentId)
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(storageRepository.fileExists).mockResolvedValue(false);

    await canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId));

    expect(storageRepository.deleteFile).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.CANCELLED })
      })
    );
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ activeUploadAttemptId: null })
    );
  });

  it('does not clear a more recent active upload attempt belonging to a different id', async () => {
    const songInstrument = createSongInstrument({
      id: songInstrumentId,
      songId,
      musicianId,
      activeUploadAttemptId: 'a5c1c1f1-3b2a-4e3d-9f7a-2b6b8b0b0b0c'
    });
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      id: SongInstrumentUploadIdMother.create(uploadId),
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PENDING),
      songId: SongInstrumentUploadSongIdMother.create(songId),
      songInstrumentId: SongInstrumentUploadSongInstrumentIdMother.create(songInstrumentId)
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);
    vi.mocked(storageRepository.fileExists).mockResolvedValue(false);

    await canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId));

    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        activeUploadAttemptId: expect.objectContaining({ value: 'a5c1c1f1-3b2a-4e3d-9f7a-2b6b8b0b0b0c' })
      })
    );
  });

  it('throws not found when the song instrument does not exist', async () => {
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(null);

    await expect(
      canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId))
    ).rejects.toThrow(SongInstrumentNotExistException);
  });

  it('throws forbidden when the authenticated musician is not assigned to the song instrument', async () => {
    const songInstrument = createSongInstrument({ id: songInstrumentId, songId, musicianId });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);

    await expect(
      canceller.run(
        new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, 'someone-else-musician-id', uploadId)
      )
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws not found when the upload does not exist', async () => {
    const songInstrument = createSongInstrument({ id: songInstrumentId, songId, musicianId });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.search).mockResolvedValue(null);

    await expect(
      canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId))
    ).rejects.toThrow(SongInstrumentUploadNotExistException);
  });

  it('throws not found when the upload does not belong to the song instrument in the path', async () => {
    const songInstrument = createSongInstrument({ id: songInstrumentId, songId, musicianId });
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      id: SongInstrumentUploadIdMother.create(uploadId),
      status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PENDING),
      songId: SongInstrumentUploadSongIdMother.create(songId),
      songInstrumentId: SongInstrumentUploadSongInstrumentIdMother.create('a5c1c1f1-3b2a-4e3d-9f7a-2b6b8b0b0b0b')
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);

    await expect(
      canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId))
    ).rejects.toThrow(SongInstrumentUploadNotExistException);
  });

  it.each([
    SongInstrumentUploadStatusValues.PROCESSING,
    SongInstrumentUploadStatusValues.COMPLETED,
    SongInstrumentUploadStatusValues.FAILED,
    SongInstrumentUploadStatusValues.CANCELLED
  ])('throws not cancellable when the upload is in status %s', async (status) => {
    const songInstrument = createSongInstrument({ id: songInstrumentId, songId, musicianId });
    const songInstrumentUpload = SongInstrumentUploadMother.create({
      id: SongInstrumentUploadIdMother.create(uploadId),
      status: SongInstrumentUploadStatusMother.create(status),
      songId: SongInstrumentUploadSongIdMother.create(songId),
      songInstrumentId: SongInstrumentUploadSongInstrumentIdMother.create(songInstrumentId)
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.search).mockResolvedValue(songInstrumentUpload);

    await expect(
      canceller.run(new SongInstrumentUploadCancelUploadCommand(songId, songInstrumentId, musicianId, uploadId))
    ).rejects.toThrow(SongInstrumentUploadNotCancellableException);
    expect(storageRepository.fileExists).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(songInstrumentRepository.save).not.toHaveBeenCalled();
  });
});

function createSongInstrument(params: {
  id: string;
  songId: string;
  musicianId: string;
  activeUploadAttemptId?: string | null;
}): SongInstrument {
  return SongInstrument.fromPrimitives({
    id: params.id,
    songId: params.songId,
    musicianId: params.musicianId,
    instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000001',
    name: 'Lead Guitar',
    createdAt: new Date('2026-07-12T12:00:00.000Z'),
    activeUploadAttemptId: params.activeUploadAttemptId ?? null
  });
}
