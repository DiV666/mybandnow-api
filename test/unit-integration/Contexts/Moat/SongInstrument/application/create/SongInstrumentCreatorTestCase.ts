import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrument } from '@Contexts/Moat/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { FakeClock } from '@Test/utils/mocks/FakeClock.js';

export class SongInstrumentCreatorTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<SongInstrumentPersistenceRepository>> = null;
  private _clock: Nullable<FakeClock> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();

  shouldSave(songInstrument: SongInstrument): void {
    const similarToSongInstrument = this.similarTo(songInstrument as unknown as Record<string, unknown>, {
      exclude: ['createdAt', 'updatedAt', 'domainEvents']
    });

    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(similarToSongInstrument)
      .andReturnNull();
  }

  shouldSearch(id: SongInstrumentId, songInstrument?: SongInstrument): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(songInstrument);
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

  async assertSaveException(
    command: Command,
    commandHandler: CommandHandler<Command>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), Exception);
  }

  persistenceRepository(): MockProxy<SongInstrumentPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<SongInstrumentPersistenceRepository>();
    }
    return this._persistenceRepository;
  }

  clock(): FakeClock {
    if (!this._clock) {
      this._clock = new FakeClock();
    }
    return this._clock;
  }
}
