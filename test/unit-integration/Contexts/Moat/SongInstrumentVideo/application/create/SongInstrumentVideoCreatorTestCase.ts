import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { SongInstrumentVideo } from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import { SongInstrumentVideoId } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoId.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { SongInstrumentVideoPersistenceRepository } from '@Contexts/Moat/SongInstrumentVideo/domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { FakeClock } from '@Test/utils/mocks/FakeClock.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrument } from '@Contexts/Moat/SongInstrument/domain/SongInstrument.js';

export class SongInstrumentVideoCreatorTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<SongInstrumentVideoPersistenceRepository>> = null;
  private _songInstrumentRepository: Nullable<MockProxy<SongInstrumentPersistenceRepository>> = null;
  private _clock: Nullable<FakeClock> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();
  private songInstrumentRepositorySearchMock: Mock = new Mock();

  shouldSave(songInstrumentVideo: SongInstrumentVideo): void {
    const similarToSongInstrumentVideo = this.similarTo(songInstrumentVideo as unknown as Record<string, unknown>, {
      exclude: ['createdAt', 'updatedAt', 'domainEvents']
    });

    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(similarToSongInstrumentVideo)
      .andReturnNull();
  }

  shouldSearch(id: SongInstrumentVideoId, songInstrumentVideo?: SongInstrumentVideo): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(songInstrumentVideo);
  }

  shouldSearchSongInstrument(id: SongInstrumentId, songInstrument?: SongInstrument): void {
    this.songInstrumentRepositorySearchMock
      .shouldReceive(this.songInstrumentRepository().search)
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

  persistenceRepository(): MockProxy<SongInstrumentVideoPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<SongInstrumentVideoPersistenceRepository>();
    }
    return this._persistenceRepository;
  }

  songInstrumentRepository(): MockProxy<SongInstrumentPersistenceRepository> {
    if (!this._songInstrumentRepository) {
      this._songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    }
    return this._songInstrumentRepository;
  }

  clock(): FakeClock {
    if (!this._clock) {
      this._clock = new FakeClock();
    }
    return this._clock;
  }
}
