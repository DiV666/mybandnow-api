import { expect } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Song } from '@Contexts/Song/domain/Song.js';
import { SongId } from '@Contexts/Song/domain/value-object/SongId.js';
import { SongPersistenceRepository } from '@Contexts/Song/domain/repository/SongPersistenceRepository.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';

export class SongCreatorTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<SongPersistenceRepository>> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();

  shouldSave(song: Song): void {
    const similarToSong = this.similarTo(song as unknown as Record<string, unknown>, {
      exclude: ['domainEvents']
    });

    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(similarToSong)
      .andReturnNull();
  }

  shouldSearch(id: SongId, song?: Song): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(song);
  }

  assertSave(data: null): void {
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
    Exception: new (id: string) => Error
  ): Promise<void> {
    await this.assertThrows(
      async () => await this.dispatch(command, commandHandler),
      Exception as unknown as new (...args: unknown[]) => Error
    );
  }

  persistenceRepository(): MockProxy<SongPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<SongPersistenceRepository>();
    }

    return this._persistenceRepository;
  }
}
