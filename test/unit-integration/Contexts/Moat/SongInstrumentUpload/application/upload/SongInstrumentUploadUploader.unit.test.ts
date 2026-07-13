import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SongInstrumentUploadUploader } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/application/upload/SongInstrumentUploadUploader.js';
import { SongInstrumentUploadPersistenceRepository } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentUploadMother } from '../../domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusMother } from '../../domain/SongInstrumentUploadStatusMother.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { SongInstrumentPersistenceRepository } from '../../../../../../../src/Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrument } from '../../../../../../../src/Contexts/Moat/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentNotExistException } from '../../../../../../../src/Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { FakeClock } from '../../../../../../utils/mocks/FakeClock.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';

describe('SongInstrumentUploadUploader', () => {
  let repository: SongInstrumentUploadPersistenceRepository;
  let songInstrumentRepository: SongInstrumentPersistenceRepository;
  let eventBus: EventBus;
  let clock: FakeClock;
  let uploader: SongInstrumentUploadUploader;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      search: vi.fn(),
      searchBySongInstrumentId: vi.fn(),
      remove: vi.fn()
    } as SongInstrumentUploadPersistenceRepository;
    songInstrumentRepository = {
      save: vi.fn(),
      search: vi.fn()
    } as SongInstrumentPersistenceRepository;
    eventBus = {
      publish: vi.fn()
    } as unknown as EventBus;
    clock = new FakeClock(new Date('2026-07-12T12:00:00.000Z'));
    uploader = new SongInstrumentUploadUploader(repository, songInstrumentRepository, eventBus, clock);
  });

  it('creates an internal songInstrumentUpload from the song instrument context when one does not exist yet', async () => {
    const songInstrument = createSongInstrument({
      id: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
      songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
      musicianId: '9416de0f-6513-4adf-ab75-ff075950179b',
      instrumentType: 'guitar'
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.searchBySongInstrumentId).mockResolvedValue(null);

    await uploader.run({
      songId: songInstrument.songId.value,
      instrumentId: songInstrument.id.value,
      musicianId: songInstrument.musicianId.value,
      fileReference: 'path/to/file.mp3'
    });

    expect(songInstrumentRepository.search).toHaveBeenCalledWith(songInstrument.id);
    expect(repository.searchBySongInstrumentId).toHaveBeenCalledWith(songInstrument.id);
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.objectContaining({ value: SongInstrumentUploadStatusValues.PROCESSING }),
        songInstrumentId: expect.objectContaining({ value: songInstrument.id.value }),
        songId: expect.objectContaining({ value: songInstrument.songId.value })
      })
    );
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('reuses the existing internal songInstrumentUpload for the song instrument', async () => {
    const songInstrument = createSongInstrument({
      id: 'f34fac9d-04f4-43e1-b62d-b4c09a885953',
      songId: '4e534dfe-3525-4606-b305-d73b7680479e',
      musicianId: '0e79ff2d-ea13-45c8-b8a3-160950f81a02'
    });
    const existingSongInstrumentUpload = SongInstrumentUploadMother.create({
      status: SongInstrumentUploadStatusMother.pending()
    });
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(songInstrument);
    vi.mocked(repository.searchBySongInstrumentId).mockResolvedValue(existingSongInstrumentUpload);

    await uploader.run({
      songId: songInstrument.songId.value,
      instrumentId: songInstrument.id.value,
      musicianId: songInstrument.musicianId.value,
      fileReference: 'path/to/file.mp3'
    });

    expect(repository.save).toHaveBeenCalledWith(existingSongInstrumentUpload);
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('throws not found when the song instrument does not exist', async () => {
    vi.mocked(songInstrumentRepository.search).mockResolvedValue(null);

    await expect(
      uploader.run({
        songId: '2915fcdf-8ae3-44f7-af0f-75a2ea6d6d18',
        instrumentId: '2a356dd8-fd63-46b8-aa3d-bf2cdf7fd2a3',
        musicianId: '9416de0f-6513-4adf-ab75-ff075950179b',
        fileReference: 'path/to/file.mp3'
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
        instrumentId: songInstrument.id.value,
        musicianId: '3ae51c35-8b20-4e86-bff1-a2f7af8ed649',
        fileReference: 'path/to/file.mp3'
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
        instrumentId: songInstrument.id.value,
        musicianId: songInstrument.musicianId.value,
        fileReference: 'path/to/file.mp3'
      })
    ).rejects.toThrow(SongInstrumentNotExistException);
  });
});

function createSongInstrument(params: {
  id: string;
  songId: string;
  musicianId: string;
  instrumentType?: string;
}): SongInstrument {
  return SongInstrument.fromPrimitives({
    id: params.id,
    songId: params.songId,
    musicianId: params.musicianId,
    instrumentType: params.instrumentType ?? 'guitar',
    name: 'Lead Guitar',
    createdAt: new Date('2026-07-12T12:00:00.000Z')
  });
}
