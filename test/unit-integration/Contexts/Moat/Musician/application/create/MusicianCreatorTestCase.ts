import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';
import { MusicianId } from '@Contexts/Moat/Musician/domain/value-object/MusicianId.js';
import { MusicianUserId } from '@Contexts/Moat/Musician/domain/value-object/MusicianUserId.js';
import { MusicianUsername } from '@Contexts/Moat/Musician/domain/value-object/MusicianUsername.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { MusicianRepository } from '@Contexts/Moat/Musician/domain/repository/MusicianRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { FakeClock } from '@Test/utils/mocks/FakeClock.js';

export class MusicianCreatorTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<MusicianRepository>> = null;
  private _clock: Nullable<FakeClock> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();

  shouldSave(musician: Musician): void {
    const similarToMusician = this.similarTo(musician as unknown as Record<string, unknown>, {
      exclude: ['createdAt', 'updatedAt', 'domainEvents']
    });

    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(similarToMusician)
      .andReturnNull();
  }

  shouldSearch(id: MusicianId, musician?: Musician): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(musician);
  }

  shouldSearchByUsername(username: MusicianUsername, musician?: Musician): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().searchByUsername)
      .once()
      .withArgs(username)
      .andReturn(musician);
  }

  shouldSearchByUserId(userId: MusicianUserId, musician?: Musician): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().searchByUserId)
      .once()
      .withArgs(userId)
      .andReturn(musician);
  }

  assertSave(data: null) {
    this.persistenceRepositorySaveMock.expect(data);
  }

  async assertSaveException(
    command: Command,
    commandHandler: CommandHandler<Command>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), Exception);
  }

  persistenceRepository(): MockProxy<MusicianRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<MusicianRepository>();
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
