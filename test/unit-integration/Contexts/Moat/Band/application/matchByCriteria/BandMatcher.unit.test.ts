import { describe, it, beforeEach } from 'vitest';
import { BandMatcher } from '@Contexts/Moat/Band/application/matchByCriteria/BandMatcher.js';
import { BandMother } from '../../domain/BandMother.js';
import { BandMatcherTestCase } from './BandMatcherTestCase.js';
import { MatchByCriteriaBandResponseMother } from './MatchByCriteriaBandResponseMother.js';
import { BandMatchByCriteriaCriteriaMother } from './BandMatchByCriteriaCriteriaMother.js';

describe('BandMatcher should', () => {
  let testCase: BandMatcherTestCase;
  let useCase: BandMatcher;

  beforeEach(() => {
    testCase = new BandMatcherTestCase();
    useCase = new BandMatcher(testCase.scopeSecurity(), testCase.persistenceRepository());
  });

  it('find a band list by id', async () => {
    const model = BandMother.create();
    const criteria = BandMatchByCriteriaCriteriaMother.byId(model.id.value);
    const response = MatchByCriteriaBandResponseMother.fromModelList([model]);

    testCase.shouldMatch(criteria, [model]);
    testCase.shouldCount(criteria, 1);
    await testCase.assertRunResponse(response, criteria, useCase);
  });
});
