import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { User } from '@Contexts/Mybandnow/User/domain/User.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { UserPersistenceRepository } from '@Contexts/Mybandnow/User/domain/repository/UserPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class UserRegisterTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<UserPersistenceRepository>> = null;
  private _scopeSecurity: Nullable<MockProxy<CriteriaScopeSecurity>> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositoryMatchingMock: Mock = new Mock();

  shouldSave(user: User): void {
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(user)
      .andReturnNull();
  }

  shouldSaveWithId(id: string): void {
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(expect.objectContaining({ id: expect.objectContaining({ value: id }) }))
      .andReturnNull();
  }

  shouldMatching(user?: User): void {
    this.persistenceRepositoryMatchingMock
      .shouldReceive(this.persistenceRepository().matching)
      .once()
      .withArgs(expect.any(Criteria))
      .andReturn(user ? [user] : []);
  }

  async assertSaveException(
    command: Command,
    commandHandler: CommandHandler<Command>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), Exception);
  }

  assertSave(data: null) {
    this.persistenceRepositorySaveMock.expect(data);
  }

  scopeSecurity(): MockProxy<CriteriaScopeSecurity> {
    if (!this._scopeSecurity) {
      this._scopeSecurity = mock<CriteriaScopeSecurity>();
      this._scopeSecurity.apply.mockImplementation((criteria) => criteria);
    }
    return this._scopeSecurity;
  }

  persistenceRepository(): MockProxy<UserPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<UserPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
