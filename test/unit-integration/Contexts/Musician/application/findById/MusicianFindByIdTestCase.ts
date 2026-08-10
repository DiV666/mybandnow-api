import { mock, MockProxy } from 'vitest-mock-extended';
import { Musician } from '@Contexts/Musician/domain/Musician.js';
import { MusicianRepository } from '@Contexts/Musician/domain/repository/MusicianRepository.js';
import { Mock } from '@Test/utils/Mock.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { MusicianId } from '@Contexts/Musician/domain/value-object/MusicianId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export class MusicianFindByIdTestCase extends TestCase {
  private _repository: Nullable<MockProxy<MusicianRepository>> = null;
  private repositorySearchMock = new Mock();

  shouldSearch(id: MusicianId, musician?: Musician): void {
    const returnValue = musician || null;

    this.repositorySearchMock.shouldReceive(this.repository().search).once().withArgs(id).andReturn(returnValue);
  }

  assertSearch(expected: Musician | null): void {
    this.repositorySearchMock.expect(expected);
  }

  repository(): MockProxy<MusicianRepository> {
    if (!this._repository) {
      this._repository = mock<MusicianRepository>();
    }

    return this._repository;
  }
}
