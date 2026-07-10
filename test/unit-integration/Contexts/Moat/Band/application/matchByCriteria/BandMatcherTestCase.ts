import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { BandPersistenceRepository } from '@Contexts/Moat/Band/domain/repository/BandPersistenceRepository.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { MatchByCriteriaBandResponse } from '@Contexts/Moat/Band/application/matchByCriteria/MatchByCriteriaBandResponse.js';
import { BandMatcher } from '@Contexts/Moat/Band/application/matchByCriteria/BandMatcher.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { AuthenticatedUserContext } from '@Contexts/Shared/application/security/AuthenticatedUserContext.js';

const defaultAuthenticatedUser: AuthenticatedUserContext = {
  userId: 'test-user-id',
  companyId: 'test-company-id',
  partnerId: 'test-partner-id',
  roles: ['admin-scope']
};

export class BandMatcherTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<BandPersistenceRepository>> = null;
  private _scopeSecurity: Nullable<MockProxy<CriteriaScopeSecurity>> = null;
  private persistenceRepositoryMock: Mock = new Mock();

  shouldMatch(criteria: Criteria, data: Band[]): void {
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

  async assertRunResponse(expected: MatchByCriteriaBandResponse, criteria: Criteria, applicationService: BandMatcher) {
    const response = await applicationService.run(defaultAuthenticatedUser, criteria);
    expect(response).toEqual(expected);
  }

  async assertRunException(
    criteria: Criteria,
    applicationService: BandMatcher,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ): Promise<void> {
    await this.assertThrows(async () => await applicationService.run(defaultAuthenticatedUser, criteria), Exception);
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
