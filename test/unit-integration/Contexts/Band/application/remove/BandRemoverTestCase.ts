import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { Band } from '@Contexts/Band/domain/Band.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { BandPersistenceRepository } from '@Contexts/Band/domain/repository/BandPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class BandRemoverTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<BandPersistenceRepository>> = null;
  private _scopeSecurity: Nullable<MockProxy<CriteriaScopeSecurity>> = null;
  private persistenceRepositoryRemoveMock: Mock = new Mock();
  private persistenceRepositoryMatchingMock: Mock = new Mock();

  shouldRemove(model: Band): void {
    this.persistenceRepositoryRemoveMock
      .shouldReceive(this.persistenceRepository().remove)
      .once()
      .withArgs(model)
      .andReturnNull();
  }

  shouldMatching(band?: Band): void {
    this.persistenceRepositoryMatchingMock
      .shouldReceive(this.persistenceRepository().matching)
      .once()
      .withArgs(expect.any(Criteria))
      .andReturn(band ? [band] : []);
  }

  assertRemove(data: null) {
    this.persistenceRepositoryRemoveMock.expect(data);
  }

  assertNotRemove() {
    expect(this.persistenceRepository().remove).not.toHaveBeenCalled();
  }

  async assertRemoveException(
    command: Command,
    commandHandler: CommandHandler<Command>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), Exception);
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
