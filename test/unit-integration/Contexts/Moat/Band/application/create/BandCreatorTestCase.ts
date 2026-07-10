import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '@Contexts/Shared/domain/Command.js';
import { CommandHandler } from '@Contexts/Shared/domain/CommandHandler.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { BandId } from '@Contexts/Moat/Band/domain/value-object/BandId.js';
import { TestCase } from '@Test/utils/TestCase.js';
import { Mock } from '@Test/utils/Mock.js';
import { BandPersistenceRepository } from '@Contexts/Moat/Band/domain/repository/BandPersistenceRepository.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { FakeClock } from '@Test/utils/mocks/FakeClock.js';
import { QueryBus } from '@Contexts/Shared/domain/QueryBus.js';

import { expect } from 'vitest';
import { Query } from '@Contexts/Shared/domain/Query.js';
import { Response } from '@Contexts/Shared/domain/Response.js';

export class BandCreatorTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<BandPersistenceRepository>> = null;
  private _clock: Nullable<FakeClock> = null;
  private _queryBus: Nullable<MockProxy<QueryBus>> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();
  private queryBusAskMock: Mock = new Mock();

  shouldAsk(query: Query, response: Response): void {
    this.queryBusAskMock
      .shouldReceive(this.queryBus().ask)
      .once()
      .withArgs(this.similarTo(query as unknown as Record<string, unknown>))
      .andReturn(Promise.resolve(response));
  }

  shouldSave(band: Band): void {
    const similarToBand = this.similarTo(band as unknown as Record<string, unknown>, {
      exclude: ['createdAt', 'domainEvents', 'members']
    });
    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(expect.objectContaining(similarToBand))
      .andReturnNull();
  }

  shouldSearch(id: BandId, band?: Band): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(band);
  }

  assertSave(data: null) {
    this.persistenceRepositorySaveMock.expect(data);
  }

  assertNotSave() {
    expect(this.persistenceRepository().save).not.toHaveBeenCalled();
  }

  async assertSaveException(
    command: Command,
    commandHandler: CommandHandler<Command>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Exception: new (...args: any[]) => Error
  ) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), Exception);
  }

  persistenceRepository(): MockProxy<BandPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<BandPersistenceRepository>();
    }
    return this._persistenceRepository;
  }

  clock(): FakeClock {
    if (!this._clock) {
      this._clock = new FakeClock();
    }
    return this._clock;
  }

  queryBus(): MockProxy<QueryBus> {
    if (!this._queryBus) {
      this._queryBus = mock<QueryBus>();
    }
    return this._queryBus;
  }
}
