import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { InstrumentsFinder } from '@Contexts/Moat/Instruments/application/search/InstrumentsFinder.js';
import { SearchInstrumentsResponse } from '@Contexts/Moat/Instruments/application/search/SearchInstrumentsResponse.js';
import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';
import { InstrumentsPersistenceRepository } from '@Contexts/Moat/Instruments/domain/repository/InstrumentsPersistenceRepository.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export class InstrumentsFinderTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<InstrumentsPersistenceRepository>> = null;
  private persistenceRepositoryMock: Mock = new Mock();

  shouldSearch(data?: Instruments | null): void {
    this.persistenceRepositoryMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .andReturn(data ?? null);
  }

  assertSearch(data: null) {
    this.persistenceRepositoryMock.expect(data);
  }

  async assertRunResponse(expected: SearchInstrumentsResponse, id: string, applicationService: InstrumentsFinder) {
    const model = await applicationService.run({ id });
    expect(model).toEqual(expected);
  }

  async assertRunException(
    id: string,
    applicationService: InstrumentsFinder,
    Exception: new (id: string) => Error
  ): Promise<void> {
    await expect(async () => await applicationService.run({ id })).rejects.toThrow(Exception);
  }

  persistenceRepository(): MockProxy<InstrumentsPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<InstrumentsPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
