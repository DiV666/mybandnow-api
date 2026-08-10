import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentAuthorizationRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { MatchByCriteriaSongInstrumentResponse } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentResponse.js';
import { SongInstrumentMatcher } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/SongInstrumentMatcher.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';

export class SongInstrumentMatcherTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<SongInstrumentPersistenceRepository>> = null;
  private _authorizationRepository: Nullable<MockProxy<SongInstrumentAuthorizationRepository>> = null;
  private persistenceRepositoryMock: Mock = new Mock();

  shouldAuthorize(songId: string, musicianId: string, isBandMember: boolean): void {
    this.persistenceRepositoryMock
      .shouldReceive(this.authorizationRepository().isBandMember)
      .once()
      .withArgs({ value: songId }, { value: musicianId })
      .andReturn(isBandMember);
  }

  shouldMatch(criteria: Criteria, data: SongInstrument[]): void {
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
    expected: MatchByCriteriaSongInstrumentResponse,
    songId: string,
    musicianId: string,
    criteria: Criteria,
    applicationService: SongInstrumentMatcher
  ) {
    const response = await applicationService.run(songId, musicianId, criteria);
    expect(response).toEqual(expected);
  }

  async assertRunException(
    songId: string,
    musicianId: string,
    criteria: Criteria,
    applicationService: SongInstrumentMatcher,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ): Promise<void> {
    await this.assertThrows(async () => await applicationService.run(songId, musicianId, criteria), Exception);
  }

  authorizationRepository(): MockProxy<SongInstrumentAuthorizationRepository> {
    if (!this._authorizationRepository) {
      this._authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    }
    return this._authorizationRepository;
  }

  persistenceRepository(): MockProxy<SongInstrumentPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<SongInstrumentPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
