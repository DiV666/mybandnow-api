import { describe, it, beforeEach } from 'vitest';
import { InstrumentsFinder } from '@Contexts/Instruments/application/search/InstrumentsFinder.js';
import { InstrumentsMother } from '../../domain/InstrumentsMother.js';
import { InstrumentsFinderTestCase } from './InstrumentsFinderTestCase.js';
import { SearchInstrumentsResponseMother } from './SearchInstrumentsResponseMother.js';
import { InstrumentsNotExistException } from '@Contexts/Instruments/domain/exception/InstrumentsNotExistException.js';

describe('InstrumentsFinder should', () => {
  let testCase: InstrumentsFinderTestCase;
  let useCase: InstrumentsFinder;

  beforeEach(() => {
    testCase = new InstrumentsFinderTestCase();
    useCase = new InstrumentsFinder(testCase.persistenceRepository());
  });

  it('find an existing instruments', async () => {
    const model = InstrumentsMother.create();
    const response = SearchInstrumentsResponseMother.fromModel(model);

    testCase.shouldSearch(model);
    await testCase.assertRunResponse(response, model.id.value, useCase);
  });

  it('throw an error if instruments does not exist', async () => {
    const model = InstrumentsMother.create();
    testCase.shouldSearch();
    await testCase.assertRunException(model.id.value, useCase, InstrumentsNotExistException);
  });
});
