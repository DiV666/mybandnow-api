import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SongInstrumentVideoFindBySongInstrumentId } from '@Contexts/SongInstrument/Video/application/findBySongInstrumentId/SongInstrumentVideoFindBySongInstrumentId.js';
import { SongInstrumentVideoPersistenceRepository } from '@Contexts/SongInstrument/Video/domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { SongInstrumentVideoMother } from '@Test/unit-integration/Contexts/SongInstrument/Video/domain/SongInstrumentVideoMother.js';

describe('SongInstrumentVideoFindBySongInstrumentId', () => {
  let repository: import('vitest').Mocked<SongInstrumentVideoPersistenceRepository>;
  let useCase: SongInstrumentVideoFindBySongInstrumentId;

  beforeEach(() => {
    repository = {
      search: vi.fn(),
      searchBySongInstrumentId: vi.fn(),
      save: vi.fn()
    };
    useCase = new SongInstrumentVideoFindBySongInstrumentId(repository);
  });

  it('returns null when no video exists for the song instrument', async () => {
    repository.searchBySongInstrumentId.mockResolvedValue(null);

    const response = await useCase.run('32345678-1234-4234-8234-123456789012');

    expect(response.video).toBeNull();
  });

  it('returns the public video shape when it exists', async () => {
    const video = SongInstrumentVideoMother.random();
    repository.searchBySongInstrumentId.mockResolvedValue(video);

    const response = await useCase.run(video.songInstrumentId.value);

    expect(response.video).toEqual({
      id: video.id.value,
      url: video.url.value,
      songInstrumentId: video.songInstrumentId.value
    });
  });
});
