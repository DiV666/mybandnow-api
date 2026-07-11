import { mock, MockProxy } from 'vitest-mock-extended';
import { Command } from '../../../../../../../src/Contexts/Shared/domain/Command.js';
import { CommandHandler } from '../../../../../../../src/Contexts/Shared/domain/CommandHandler.js';
import { Videoclip } from '../../../../../../../src/Contexts/Moat/Videoclip/domain/Videoclip.js';
import { VideoclipId } from '../../../../../../../src/Contexts/Moat/Videoclip/domain/value-object/VideoclipId.js';
import { TestCase } from '../../../../../../utils/TestCase.js';
import { Mock } from '../../../../../../utils/Mock.js';
import { VideoclipPersistenceRepository } from '../../../../../../../src/Contexts/Moat/Videoclip/domain/repository/VideoclipPersistenceRepository.js';
import { Nullable } from '../../../../../../../src/Contexts/Shared/domain/Nullable.js';

export class VideoclipCreatorTestCase extends TestCase {
  private _persistenceRepository: Nullable<MockProxy<VideoclipPersistenceRepository>> = null;
  private persistenceRepositorySaveMock: Mock = new Mock();
  private persistenceRepositorySearchMock: Mock = new Mock();

  shouldSave(videoclip: Videoclip): void {
    const similarToVideoclip = this.similarTo(videoclip as unknown as Record<string, unknown>, {
      exclude: ['createdAt', 'updatedAt', 'domainEvents']
    });

    this.persistenceRepositorySaveMock
      .shouldReceive(this.persistenceRepository().save)
      .once()
      .withArgs(similarToVideoclip)
      .andReturnNull();
  }

  shouldSearch(id: VideoclipId, videoclip?: Videoclip): void {
    this.persistenceRepositorySearchMock
      .shouldReceive(this.persistenceRepository().search)
      .once()
      .withArgs(id)
      .andReturn(videoclip);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assertSave(data: any) {
    this.persistenceRepositorySaveMock.expect(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async assertSaveException(command: Command, commandHandler: CommandHandler<Command>, Exception: any) {
    await this.assertThrows(async () => await this.dispatch(command, commandHandler), Exception);
  }

  persistenceRepository(): MockProxy<VideoclipPersistenceRepository> {
    if (!this._persistenceRepository) {
      this._persistenceRepository = mock<VideoclipPersistenceRepository>();
    }
    return this._persistenceRepository;
  }
}
