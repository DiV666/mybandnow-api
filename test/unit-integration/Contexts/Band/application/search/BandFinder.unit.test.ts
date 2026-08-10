import { describe, it, beforeEach } from 'vitest';
import { BandFinder } from '@Contexts/Band/application/search/BandFinder.js';
import { BandMother } from '../../domain/BandMother.js';
import { BandFinderTestCase } from './BandFinderTestCase.js';
import { SearchBandResponseMother } from './SearchBandResponseMother.js';
import { BandNotExistException } from '@Contexts/Band/domain/exception/BandNotExistException.js';

describe('BandFinder should', () => {
  let testCase: BandFinderTestCase;
  let useCase: BandFinder;

  beforeEach(() => {
    testCase = new BandFinderTestCase();
    useCase = new BandFinder(testCase.scopeSecurity(), testCase.persistenceRepository());
  });

  it('find an existing band', async () => {
    const model = BandMother.create();
    const response = SearchBandResponseMother.fromModel(model);

    testCase.shouldMatching(model);
    await testCase.assertRunResponse(response, model.id.value, useCase);
  });

  it('throw an error if band does not exist', async () => {
    const model = BandMother.create();
    testCase.shouldMatching();
    await testCase.assertRunException(model.id.value, useCase, BandNotExistException);
  });
});
