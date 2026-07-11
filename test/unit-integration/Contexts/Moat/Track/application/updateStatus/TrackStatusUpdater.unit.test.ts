import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TrackStatusUpdater } from '../../../../../../../src/Contexts/Moat/Track/application/updateStatus/TrackStatusUpdater.js';
import { TrackPersistenceRepository } from '../../../../../../../src/Contexts/Moat/Track/domain/repository/TrackPersistenceRepository.js';
import { TrackMother } from '../../domain/TrackMother.js';
import { TrackStatusValues } from '../../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackStatus.js';
import { TrackNotExistException } from '../../../../../../../src/Contexts/Moat/Track/domain/exception/TrackNotExistException.js';

import { EventBus } from '@Contexts/Shared/domain/EventBus.js';

describe('TrackStatusUpdater', () => {
  let repository: TrackPersistenceRepository;
  let eventBus: EventBus;
  let updater: TrackStatusUpdater;

  beforeEach(() => {
    repository = {
      save: vi.fn(),
      search: vi.fn(),
      remove: vi.fn()
    };
    eventBus = {
      publish: vi.fn()
    } as unknown as EventBus;
    updater = new TrackStatusUpdater(repository, eventBus);
  });

  it('should update a track status to completed', async () => {
    const track = TrackMother.create();
    vi.mocked(repository.search).mockResolvedValue(track);

    await updater.run({ id: track.id.value, status: TrackStatusValues.COMPLETED });

    expect(repository.search).toHaveBeenCalledWith(track.id);
    expect(repository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should throw an error if track does not exist', async () => {
    vi.mocked(repository.search).mockResolvedValue(null);
    const nonExistentId = TrackMother.create().id.value;

    await expect(updater.run({ id: nonExistentId, status: TrackStatusValues.COMPLETED })).rejects.toThrow(
      TrackNotExistException
    );
  });
});
