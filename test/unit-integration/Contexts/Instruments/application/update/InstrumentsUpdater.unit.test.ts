import { describe, it, beforeEach } from 'vitest';
import { InstrumentsUpdater } from '@Contexts/Instruments/application/update/InstrumentsUpdater.js';
import { UpdateInstrumentsCommandHandler } from '@Contexts/Instruments/application/update/UpdateInstrumentsCommandHandler.js';
import { InstrumentsNotExistException } from '@Contexts/Instruments/domain/exception/InstrumentsNotExistException.js';
import { InstrumentsMother } from '../../domain/InstrumentsMother.js';
import { InstrumentsUpdatedDomainEventMother } from '../../domain/InstrumentsUpdatedDomainEventMother.js';
import { UpdateInstrumentsCommandMother } from './UpdateInstrumentsCommandMother.js';
import { InstrumentsUpdaterTestCase } from './InstrumentsUpdaterTestCase.js';

describe('InstrumentsUpdater should', () => {
  let testCase: InstrumentsUpdaterTestCase;
  let commandHandler: UpdateInstrumentsCommandHandler;

  beforeEach(() => {
    testCase = new InstrumentsUpdaterTestCase();
    const useCase = new InstrumentsUpdater(testCase.persistenceRepository(), testCase.eventBus());
    commandHandler = new UpdateInstrumentsCommandHandler(useCase);
  });

  it('update a valid instruments with different properties', async () => {
    const model = InstrumentsMother.create();
    const command = UpdateInstrumentsCommandMother.create({ id: model.id.value });
    const updatedModel = model.update({ description: command.description, name: command.name });

    testCase.shouldSearch(model);
    testCase.shouldSaveWithId(command.id);
    testCase.shouldPublishDomainEvent(InstrumentsUpdatedDomainEventMother.fromModel(updatedModel));

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('return success without saving when the instruments has the same properties (idempotency)', async () => {
    const model = InstrumentsMother.create();
    const command = UpdateInstrumentsCommandMother.fromModel(model);

    testCase.shouldSearch(model);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('throw an exception when the instruments does not exist', async () => {
    const model = InstrumentsMother.create();
    const command = UpdateInstrumentsCommandMother.fromModel(model);

    testCase.shouldSearch();

    await testCase.assertSaveException(command, commandHandler, new InstrumentsNotExistException(command.id));
  });
});
