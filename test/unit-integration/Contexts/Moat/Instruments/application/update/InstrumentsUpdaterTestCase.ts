import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { InstrumentsPersistenceRepository } from '@Contexts/Moat/Instruments/domain/repository/InstrumentsPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { InstrumentsId } from '@Contexts/Moat/Instruments/domain/value-object/InstrumentsId.js';

export class InstrumentsUpdaterTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<InstrumentsPersistenceRepository>> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();

  shouldSave(instruments: Instruments): void {
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(instruments)
      .andReturnNull();
  }

  shouldSaveWithId(id: string): void {
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(expect.objectContaining({ id: expect.objectContaining({ value: id }) }))
      .andReturnNull();
  }

  shouldSearch(instruments?: Instruments): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(expect.any(InstrumentsId))
      .andReturn(instruments ?? null);
  }

  async assertSaveException(command: Command, commandHandler: CommandHandler<Command>, exception: Error) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), exception);
  }

  assertSave(data: null) {
    this.persistenceRepositorySaveMock.expect(data);
  }

  assertSaveNotCalled(): void {
    expect(this.persistenceRepository().save).not.toHaveBeenCalled();
  }

  assertPublishDomainEventNotCalled(): void {
    expect(this.eventBus().publish).not.toHaveBeenCalled();
  }

  persistenceRepository(): MockProxy<InstrumentsPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<InstrumentsPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
