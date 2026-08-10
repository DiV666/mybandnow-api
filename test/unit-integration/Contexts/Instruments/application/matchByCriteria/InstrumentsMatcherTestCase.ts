import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Instruments } from '@Contexts/Instruments/domain/Instruments.js';
import { InstrumentsPersistenceRepository } from '@Contexts/Instruments/domain/repository/InstrumentsPersistenceRepository.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { MatchByCriteriaInstrumentsResponse } from '@Contexts/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsResponse.js';
import { InstrumentsMatcher } from '@Contexts/Instruments/application/matchByCriteria/InstrumentsMatcher.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export class InstrumentsMatcherTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<InstrumentsPersistenceRepository>> = null;
  private persistenceRepositoryMock: Mock = new Mock();

  shouldMatch(criteria: Criteria, data: Instruments[]): void {
    this.persistenceRepositoryMock
      .shouldReceive(this.persistenceRepository().matching)
      .once()
      .withArgs(criteria)
      .andReturn(data);
  }

  shouldCount(criteria: Criteria, count: number): void {
    this.persistenceRepositoryMock
      .shouldReceive(this.persistenceRepository().matchingCount)
      .once()
      .withArgs(criteria)
      .andReturn(count);
  }

  assertMatch(data: null) {
    this.persistenceRepositoryMock.expect(data);
  }

  async assertRunResponse(
    expected: MatchByCriteriaInstrumentsResponse,
    criteria: Criteria,
    applicationService: InstrumentsMatcher
  ) {
    const response = await applicationService.run(criteria);
    expect(response).toEqual(expected);
  }

  async assertRunException(
    criteria: Criteria,
    applicationService: InstrumentsMatcher,
    Exception: new (...args: unknown[]) => Error
  ): Promise<void> {
    await this.assertThrows(async () => await applicationService.run(criteria), Exception);
  }

  persistenceRepository(): MockProxy<InstrumentsPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<InstrumentsPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
