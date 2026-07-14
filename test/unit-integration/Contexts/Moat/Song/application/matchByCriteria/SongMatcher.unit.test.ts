import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SongMatcher } from '@Contexts/Moat/Song/application/matchByCriteria/SongMatcher.js';
import type { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import { SongMusicianId } from '@Contexts/Moat/Song/domain/value-object/SongMusicianId.js';
import { SongMother } from '@Test/unit-integration/Contexts/Moat/Song/domain/SongMother.js';
import { MatchByCriteriaSongResponse } from '@Contexts/Moat/Song/application/matchByCriteria/MatchByCriteriaSongResponse.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';

describe('SongMatcher', () => {
  it('returns the songs visible to the authenticated musician with the matching total', async () => {
    // Arrange
    const repository = mock<SongPersistenceRepository>();
    const useCase = new SongMatcher(repository);
    const firstSong = SongMother.create();
    const secondSong = SongMother.create({ bandId: firstSong.bandId });
    const criteria = new Criteria(
      new Filters([
        new Filter(new FilterField('title'), FilterOperator.fromValue('CONTAINS'), new FilterValue('Road'))
      ]),
      Order.asc('title'),
      10,
      0
    );

    repository.matching.mockResolvedValue([firstSong, secondSong]);
    repository.matchingCount.mockResolvedValue(2);

    // Act
    const response = await useCase.run('0db9d8d0-eef8-46db-bfec-017dc53f1440', criteria);

    // Assert
    expect(repository.matching).toHaveBeenCalledExactlyOnceWith(
      criteria,
      new SongMusicianId('0db9d8d0-eef8-46db-bfec-017dc53f1440')
    );
    expect(repository.matchingCount).toHaveBeenCalledExactlyOnceWith(
      criteria,
      new SongMusicianId('0db9d8d0-eef8-46db-bfec-017dc53f1440')
    );
    expect(response).toEqual(new MatchByCriteriaSongResponse([firstSong, secondSong], 2));
  });

  it('returns an empty list with total zero when no song matches the scoped criteria', async () => {
    // Arrange
    const repository = mock<SongPersistenceRepository>();
    const useCase = new SongMatcher(repository);
    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('bandId'), FilterOperator.equal(), new FilterValue('band-id'))]),
      Order.asc('title'),
      10,
      0
    );

    repository.matching.mockResolvedValue([]);
    repository.matchingCount.mockResolvedValue(0);

    // Act
    const response = await useCase.run('794d85d4-3dfe-44ce-9354-b0d83717cfec', criteria);

    // Assert
    expect(response).toEqual(new MatchByCriteriaSongResponse([], 0));
  });
});
