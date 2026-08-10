import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SongListByBand } from '@Contexts/Song/application/listByBand/SongListByBand.js';
import { SongListByBandQuery } from '@Contexts/Song/application/listByBand/SongListByBandQuery.js';
import type { SongAuthorizationRepository } from '@Contexts/Song/domain/repository/SongAuthorizationRepository.js';
import type { SongPersistenceRepository } from '@Contexts/Song/domain/repository/SongPersistenceRepository.js';
import { SongBandId } from '@Contexts/Song/domain/value-object/SongBandId.js';
import { SongMusicianId } from '@Contexts/Song/domain/value-object/SongMusicianId.js';
import { SongMother } from '@Test/unit-integration/Contexts/Song/domain/SongMother.js';
import { SongListByBandResponse } from '@Contexts/Song/application/listByBand/SongListByBandResponse.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('SongListByBand', () => {
  it('returns the songs of a band with the total for an authenticated band member', async () => {
    // Arrange
    const persistenceRepository = mock<SongPersistenceRepository>();
    const authorizationRepository = mock<SongAuthorizationRepository>();
    const useCase = new SongListByBand(persistenceRepository, authorizationRepository);
    const firstSong = SongMother.create();
    const secondSong = SongMother.create({ bandId: new SongBandId(firstSong.bandId.value) });
    const query = new SongListByBandQuery(firstSong.bandId.value, '0db9d8d0-eef8-46db-bfec-017dc53f1440');

    authorizationRepository.isBandMember.mockResolvedValue(true);
    persistenceRepository.searchByBandId.mockResolvedValue([firstSong, secondSong]);
    persistenceRepository.countByBandId.mockResolvedValue(2);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(authorizationRepository.isBandMember).toHaveBeenCalledExactlyOnceWith(
      new SongBandId(query.bandId),
      new SongMusicianId(query.musicianId)
    );
    expect(persistenceRepository.searchByBandId).toHaveBeenCalledExactlyOnceWith(new SongBandId(query.bandId));
    expect(persistenceRepository.countByBandId).toHaveBeenCalledExactlyOnceWith(new SongBandId(query.bandId));
    expect(response).toEqual(new SongListByBandResponse([firstSong, secondSong], 2));
  });

  it('returns an empty list with total zero when the band has no songs', async () => {
    // Arrange
    const persistenceRepository = mock<SongPersistenceRepository>();
    const authorizationRepository = mock<SongAuthorizationRepository>();
    const useCase = new SongListByBand(persistenceRepository, authorizationRepository);
    const query = new SongListByBandQuery(
      '73ca05c2-0c42-4715-a801-57465b46224f',
      '794d85d4-3dfe-44ce-9354-b0d83717cfec'
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    persistenceRepository.searchByBandId.mockResolvedValue([]);
    persistenceRepository.countByBandId.mockResolvedValue(0);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(response).toEqual(new SongListByBandResponse([], 0));
  });

  it('throws forbidden when the authenticated musician does not belong to the band', async () => {
    // Arrange
    const persistenceRepository = mock<SongPersistenceRepository>();
    const authorizationRepository = mock<SongAuthorizationRepository>();
    const useCase = new SongListByBand(persistenceRepository, authorizationRepository);
    const query = new SongListByBandQuery(
      'd30b0954-ff29-40e5-b4b1-fce7cdd6ea90',
      'e190c0fc-7f86-4da2-9d80-86763fd14e84'
    );

    authorizationRepository.isBandMember.mockResolvedValue(false);

    // Act / Assert
    await expect(useCase.run(query)).rejects.toThrow(ForbiddenException);
    expect(persistenceRepository.searchByBandId).not.toHaveBeenCalled();
    expect(persistenceRepository.countByBandId).not.toHaveBeenCalled();
  });
});
