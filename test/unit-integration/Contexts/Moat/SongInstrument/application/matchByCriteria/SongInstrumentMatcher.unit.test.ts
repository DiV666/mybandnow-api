import { describe, it, beforeEach } from 'vitest';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentMatcher } from '@Contexts/Moat/SongInstrument/application/matchByCriteria/SongInstrumentMatcher.js';
import { SongInstrumentMother } from '../../domain/SongInstrumentMother.js';
import { SongInstrumentMatcherTestCase } from './SongInstrumentMatcherTestCase.js';
import { MatchByCriteriaSongInstrumentResponseMother } from './MatchByCriteriaSongInstrumentResponseMother.js';
import { SongInstrumentMatchByCriteriaCriteriaMother } from './SongInstrumentMatchByCriteriaCriteriaMother.js';

describe('SongInstrumentMatcher should', () => {
  let testCase: SongInstrumentMatcherTestCase;
  let useCase: SongInstrumentMatcher;

  beforeEach(() => {
    testCase = new SongInstrumentMatcherTestCase();
    useCase = new SongInstrumentMatcher(testCase.persistenceRepository(), testCase.authorizationRepository());
  });

  it('find a songinstrument list scoped to the requested song for an authorized band member', async () => {
    const model = SongInstrumentMother.create();
    const criteria = SongInstrumentMatchByCriteriaCriteriaMother.withConflictingSongScope(
      '48baf7d0-b8d5-4831-b0a8-997a23f17001',
      model.instrumentType.value
    );
    const scopedCriteria = SongInstrumentMatchByCriteriaCriteriaMother.forSongAndInstrumentType(
      model.songId.value,
      model.instrumentType.value,
      criteria.order,
      criteria.limit,
      criteria.offset
    );
    const response = MatchByCriteriaSongInstrumentResponseMother.fromModelList([model]);

    testCase.shouldAuthorize(model.songId.value, model.musicianId.value, true);
    testCase.shouldMatch(scopedCriteria, [model]);
    testCase.shouldCount(scopedCriteria, 1);
    await testCase.assertRunResponse(response, model.songId.value, model.musicianId.value, criteria, useCase);
  });

  it('reject listing for musicians outside the song band', async () => {
    const model = SongInstrumentMother.create();
    const criteria = SongInstrumentMatchByCriteriaCriteriaMother.byId(model.id.value);

    testCase.shouldAuthorize(model.songId.value, model.musicianId.value, false);
    await testCase.assertRunException(
      model.songId.value,
      model.musicianId.value,
      criteria,
      useCase,
      ForbiddenException
    );
  });
});
