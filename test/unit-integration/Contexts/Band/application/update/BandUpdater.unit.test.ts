import { describe, it, beforeEach } from 'vitest';
import { BandUpdater } from '@Contexts/Band/application/update/BandUpdater.js';
import { BandMother } from '../../domain/BandMother.js';
import { UpdateBandCommandMother } from './UpdateBandCommandMother.js';
import { UpdateBandCommandHandler } from '@Contexts/Band/application/update/UpdateBandCommandHandler.js';
import { BandUpdaterTestCase } from './BandUpdaterTestCase.js';
import { BandNotExistException } from '@Contexts/Band/domain/exception/BandNotExistException.js';

describe('BandUpdater should', () => {
  let testCase: BandUpdaterTestCase;
  let commandHandler: UpdateBandCommandHandler;

  beforeEach(() => {
    testCase = new BandUpdaterTestCase();
    const useCase = new BandUpdater(
      testCase.logger(),
      testCase.scopeSecurity(),
      testCase.persistenceRepository(),
      testCase.eventBus()
    );
    commandHandler = new UpdateBandCommandHandler(useCase);
  });

  it('update a valid band with different properties', async () => {
    const model = BandMother.create();
    const command = UpdateBandCommandMother.create({
      id: model.id.value,
      name: `${model.name.value}updated`
    });

    testCase.shouldMatching(model);
    testCase.shouldSaveWithId(command.id);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
  });

  it('return success without saving when the band has the same properties (idempotency)', async () => {
    const model = BandMother.create();
    const command = UpdateBandCommandMother.fromModel(model); // Same properties

    testCase.shouldMatching(model);
    await testCase.dispatch(command, commandHandler);
    testCase.assertNotSave();
  });

  it('throw an exception when the band does not exist', async () => {
    const model = BandMother.create();
    const command = UpdateBandCommandMother.fromModel(model);
    testCase.shouldMatching();
    await testCase.assertSaveException(command, commandHandler, BandNotExistException);
  });
});
