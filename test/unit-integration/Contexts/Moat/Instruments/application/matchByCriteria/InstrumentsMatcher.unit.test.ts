import { describe, it, beforeEach } from 'vitest';
import { InstrumentsMatcher } from '@Contexts/Moat/Instruments/application/matchByCriteria/InstrumentsMatcher.js';
import { InstrumentsMother } from '../../domain/InstrumentsMother.js';
import { InstrumentsMatcherTestCase } from './InstrumentsMatcherTestCase.js';
import { MatchByCriteriaInstrumentsResponseMother } from './MatchByCriteriaInstrumentsResponseMother.js';
import { InstrumentsMatchByCriteriaCriteriaMother } from './InstrumentsMatchByCriteriaCriteriaMother.js';

describe('InstrumentsMatcher should', () => {
  let testCase: InstrumentsMatcherTestCase;
  let useCase: InstrumentsMatcher;

  beforeEach(() => {
    testCase = new InstrumentsMatcherTestCase();
    useCase = new InstrumentsMatcher(testCase.persistenceRepository());
  });

  it('find a instruments list by id', async () => {
    const model = InstrumentsMother.create();
    const criteria = InstrumentsMatchByCriteriaCriteriaMother.byId(model.id.value);
    const response = MatchByCriteriaInstrumentsResponseMother.fromModelList([model]);

    testCase.shouldMatch(criteria, [model]);
    testCase.shouldCount(criteria, 1);
    await testCase.assertRunResponse(response, criteria, useCase);
  });
});
