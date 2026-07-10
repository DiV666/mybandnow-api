import { TestCase } from '@Test/utils/TestCase.js';
import { MusicianRepository } from '@Contexts/Moat/Musician/domain/repository/MusicianRepository.js';
import { MockProxy, mock } from 'vitest-mock-extended';
import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';
import { MusicianUserId } from '@Contexts/Moat/Musician/domain/value-object/MusicianUserId.js';
import { Mock } from '@Test/utils/Mock.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export class MusicianSearchByUserIdTestCase extends TestCase {
  private _repository: Nullable<MockProxy<MusicianRepository>> = null;
  private repositorySearchByUserIdMock = new Mock();

  shouldSearchByUserId(userId: MusicianUserId, musician?: Musician): void {
    const returnVal = musician || null;
    this.repositorySearchByUserIdMock
      .shouldReceive(this.repository().searchByUserId)
      .once()
      .withArgs(userId)
      .andReturn(returnVal);
  }

  assertSearchByUserId(expected: Musician | null): void {
    this.repositorySearchByUserIdMock.expect(expected);
  }

  repository(): MockProxy<MusicianRepository> {
    this._repository ??= mock<MusicianRepository>();
    return this._repository;
  }
}
