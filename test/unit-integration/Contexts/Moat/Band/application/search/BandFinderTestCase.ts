import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { BandFinder } from '@Contexts/Moat/Band/application/search/BandFinder.js';
import { SearchBandResponse } from '@Contexts/Moat/Band/application/search/SearchBandResponse.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { BandPersistenceRepository } from '@Contexts/Moat/Band/domain/repository/BandPersistenceRepository.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

const defaultAuthenticatedUser: AuthenticatedUserContext = {
  userId: 'test-user-id',
  companyId: 'test-company-id',
  partnerId: 'test-partner-id',
  roles: ['admin-scope']
};

export class BandFinderTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<BandPersistenceRepository>> = null;
  private _scopeSecurity: Nullable<MockProxy<CriteriaScopeSecurity>> = null;
  private persistenceRepositoryMock: Mock = new Mock();

  shouldMatching(data?: Band | null): void {
    this.persistenceRepositoryMock
      .shouldReceive(this.persistenceRepository().matching)
      .once()
      .withArgs(expect.any(Criteria))
      .andReturn(data ? [data] : []);
  }

  assertMatching(data: null) {
    this.persistenceRepositoryMock.expect(data);
  }

  async assertRunResponse(expected: SearchBandResponse, id: string, applicationService: BandFinder) {
    const model = await applicationService.run({ authenticatedUser: defaultAuthenticatedUser, id });
    expect(model).toEqual(expected);
  }

  async assertRunException(
    id: string,
    applicationService: BandFinder,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ): Promise<void> {
    await this.assertThrows(
      async () => await applicationService.run({ authenticatedUser: defaultAuthenticatedUser, id }),
      Exception
    );
  }

  scopeSecurity(): MockProxy<CriteriaScopeSecurity> {
    if (!this._scopeSecurity) {
      this._scopeSecurity = mock<CriteriaScopeSecurity>();
      this._scopeSecurity.apply.mockImplementation((criteria) => criteria);
    }
    return this._scopeSecurity;
  }

  persistenceRepository(): MockProxy<BandPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<BandPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
