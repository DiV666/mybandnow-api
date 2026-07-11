import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TrackUploader } from '../../../../../../../src/Contexts/Moat/Track/application/upload/TrackUploader.js';
import { TrackPersistenceRepository } from '../../../../../../../src/Contexts/Moat/Track/domain/repository/TrackPersistenceRepository.js';
import { TrackMother } from '../../domain/TrackMother.js';
import { TrackNotExistException } from '../../../../../../../src/Contexts/Moat/Track/domain/exception/TrackNotExistException.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

describe('TrackUploader', () => {
  let repository: TrackPersistenceRepository;
  let eventBus: EventBus;
  let uploader: TrackUploader;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      search: vi.fn(),
      remove: vi.fn()
    };
    eventBus = {
      publish: vi.fn()
    } as unknown as EventBus;
    uploader = new TrackUploader(repository, eventBus);
  });

  it('should process upload for a track', async () => {
    const track = TrackMother.create();
    vi.mocked(repository.search).mockResolvedValue(track);

    await uploader.run({
      id: track.id.value,
      fileReference: 'path/to/file.mp3'
    });

    expect(repository.search).toHaveBeenCalledWith(track.id);
    expect(repository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should throw an error if track does not exist', async () => {
    vi.mocked(repository.search).mockResolvedValue(null);

    await expect(uploader.run({
      id: 'any-id',
      fileReference: 'path/to/file.mp3'
    })).rejects.toThrow(TrackNotExistException);
  });
});
