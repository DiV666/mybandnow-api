import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { BandPersistenceRepository } from '@Contexts/Moat/Band/domain/repository/BandPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class BandUpdaterTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<BandPersistenceRepository>> = null;
  private _scopeSecurity: Nullable<MockProxy<CriteriaScopeSecurity>> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositoryMatchingMock: Mock = new Mock();

  shouldSave(band: Band): void {
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(band)
      .andReturnNull();
  }

  shouldSaveWithId(id: string): void {
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(expect.objectContaining({ id: expect.objectContaining({ value: id }) }))
      .andReturnNull();
  }

  shouldMatching(band?: Band): void {
    this.persistenceRepositoryMatchingMock
      .shouldReceive(this.persistenceRepository().matching)
      .once()
      .withArgs(expect.any(Criteria))
      .andReturn(band ? [band] : []);
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

  assertNotSave() {
    expect(this.persistenceRepository().save).not.toHaveBeenCalled();
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
