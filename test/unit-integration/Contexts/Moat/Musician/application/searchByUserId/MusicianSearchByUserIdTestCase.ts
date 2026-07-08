import { TestCase } from '@Test/utils/TestCase.js';
import { MusicianRepository } from '@Contexts/Moat/Musician/domain/repository/MusicianRepository.js';
import { MockProxy, mock } from 'vitest-mock-extended';
import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';
import { MusicianUserId } from '@Contexts/Moat/Musician/domain/value-object/MusicianUserId.js';
import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { Mock } from '@Test/utils/Mock.js';

export class MusicianSearchByUserIdTestCase extends TestCase {
  private _repository: MockProxy<MusicianRepository> | null = null;
  private repositorySearchByUserIdMock = new Mock();

  shouldSearchByUserId(userId: MusicianUserId, musician?: Musician): void {
    const returnVal = musician || null;
    this.repositorySearchByUserIdMock
      .shouldReceive(this.repository().searchByUserId)
      .once()
      .withArgs(userId)
      .andReturn(returnVal);
  }

  assertSearchByUserId(expected: any): void {
    this.repositorySearchByUserIdMock.expect(expected);
  }

  async dispatchQuery(query: Query, handler: QueryHandler<Query, any>): Promise<any> {
    // using dispatch method from TestCase, wait dispatch is for commands usually, but maybe it works for queries
    // actually, we can just call handler.handle(query) directly in the test if we prefer
    return handler.handle(query);
  }

  repository(): MockProxy<MusicianRepository> {
    return (this._repository ??= mock<MusicianRepository>());
  }
}
