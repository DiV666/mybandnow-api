import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongInstrumentUploadUrlRequester } from '../../../../../../../src/Contexts/SongInstrument/Upload/application/requestUploadUrl/SongInstrumentUploadUrlRequester.js';
import { SongInstrumentUploadRequestUploadUrlQuery } from '../../../../../../../src/Contexts/SongInstrument/Upload/application/requestUploadUrl/SongInstrumentUploadRequestUploadUrlQuery.js';
import { SongInstrumentUploadPersistenceRepository } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrument } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentNotExistException } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { FakeClock } from '../../../../../../utils/mocks/FakeClock.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadStorageRepository } from '../../../../../../../src/Contexts/SongInstrument/Upload/domain/repository/SongInstrumentUploadStorageRepository.js';

describe('SongInstrumentUploadUrlRequester', () => {
  let repository: SongInstrumentUploadPersistenceRepository;
  let songInstrumentRepository: SongInstrumentPersistenceRepository;
  let storageRepository: SongInstrumentUploadStorageRepository;
  let clock: FakeClock;
  let requester: SongInstrumentUploadUrlRequester;

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
      getWriteSignedUrl: vi.fn().mockResolvedValue('https://storage.googleapis.com/bucket/signed-write-url'),
      fileExists: vi.fn(),
      deleteFile: vi.fn()
    } as SongInstrumentUploadStorageRepository;
    clock = new FakeClock(new Date('2026-07-12T12:00:00.000Z'));
    requester = new SongInstrumentUploadUrlRequester(repository, songInstrumentRepository, storageRepository, clock);
  });

  it('creates a pending songInstrumentUpload and returns a write signed url', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);

    const response = await requester.run(
      new SongInstrumentUploadRequestUploadUrlQuery(
        songInstrument.songId.value,
        songInstrument.id.value,
        songInstrument.musicianId.value
      )
    );

    expect(songInstrumentRepository.search).toHaveBeenCalledWith(songInstrument.id);
    expect(repository.saveWithSongInstrument).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.PENDING }),
        songInstrumentId: expect.objectContaining({ value: songInstrument.id.value }),
        songId: expect.objectContaining({ value: songInstrument.songId.value })
      }),
      expect.objectContaining({
        id: expect.objectContaining({ value: songInstrument.id.value }),
        activeUploadAttemptId: expect.objectContaining({ value: response.uploadId })
      })
    );
    expect(storageRepository.getWriteSignedUrl).toHaveBeenCalledWith(
      expect.stringMatching(isSongInstrumentUploadPath(response.uploadId)),
      'video/mp4'
    );
    expect(response.uploadUrl).toBe('https://storage.googleapis.com/bucket/signed-write-url');
  });

  it('throws not found when the song instrument does not exist', async () => {
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(null);

    await expect(
      requester.run(
        new SongInstrumentUploadRequestUploadUrlQuery(
          '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
          '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
          '9416de0f-6513-4adf-ab75-ff075950179b'
        )
      )
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
      requester.run(
        new SongInstrumentUploadRequestUploadUrlQuery(
          songInstrument.songId.value,
          songInstrument.id.value,
          '3ae51c35-8b20-4e86-bff1-a2f7af8ed649'
        )
      )
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
      requester.run(
        new SongInstrumentUploadRequestUploadUrlQuery(
          '54dbbe97-77ec-4787-99a1-c085e952cd70',
          songInstrument.id.value,
          songInstrument.musicianId.value
        )
      )
    ).rejects.toThrow(SongInstrumentNotExistException);
  });
});

function isSongInstrumentUploadPath(uploadId: string): RegExp {
  return new RegExp(`^song-instrument-uploads/[^/]+/[^/]+/${uploadId}\\.mp4$`);
}

function createSongInstrument(params: { id: string; songId: string; musicianId: string }): SongInstrument {
  return SongInstrument.fromPrimitives({
    id: params.id,
    songId: params.songId,
    musicianId: params.musicianId,
    instrumentId: '0e7a0d5f-3d2a-4bc1-8d4d-100000000001',
    name: 'Lead Guitar',
    createdAt: new Date('2026-07-12T12:00:00.000Z'),
    activeUploadAttemptId: null
  });
}
