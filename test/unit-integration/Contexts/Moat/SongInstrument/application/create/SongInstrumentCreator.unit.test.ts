import { describe, it, beforeEach } from 'vitest';
import { SongInstrumentCreator } from '@Contexts/Moat/SongInstrument/application/create/SongInstrumentCreator.js';
import { SongInstrumentMother } from '../../domain/SongInstrumentMother.js';
import { SongInstrumentIdMother } from '../../domain/SongInstrumentIdMother.js';
import { CreateSongInstrumentCommandMother } from './CreateSongInstrumentCommandMother.js';
import { CreateSongInstrumentCommandHandler } from '@Contexts/Moat/SongInstrument/application/create/CreateSongInstrumentCommandHandler.js';
import { SongInstrumentCreatorTestCase } from './SongInstrumentCreatorTestCase.js';
import { SongInstrumentCreatedDomainEventMother } from '../../domain/SongInstrumentCreatedDomainEventMother.js';
import { SongInstrumentExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentExistException.js';

describe('SongInstrumentCreator should', () => {
  let testCase: SongInstrumentCreatorTestCase;
  let commandHandler: CreateSongInstrumentCommandHandler;

  beforeEach(() => {
    testCase = new SongInstrumentCreatorTestCase();
    const useCase = new SongInstrumentCreator(
      testCase.logger(),
      testCase.persistenceRepository(),
      testCase.eventBus(),
      testCase.clock()
    );
    commandHandler = new CreateSongInstrumentCommandHandler(useCase);
  });

  it('create a valid songinstrument', async () => {
    const songinstrument = SongInstrumentMother.create();
    const command = CreateSongInstrumentCommandMother.fromModel(songinstrument);
    const domainEvent = SongInstrumentCreatedDomainEventMother.fromModel(songinstrument);

    testCase.shouldSearch(songinstrument.id); // Ensure it doesn't exist
    testCase.shouldSave(songinstrument);
    testCase.shouldPublishDomainEvent(domainEvent, ['attributes.createdAt', 'attributes.updatedAt']);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('return success when the songinstrument already exists with the same properties (idempotency)', async () => {
    const songinstrument = SongInstrumentMother.create();
    const command = CreateSongInstrumentCommandMother.fromModel(songinstrument);

    testCase.shouldSearch(songinstrument.id, songinstrument); // Mock that it exists
    await testCase.dispatch(command, commandHandler);
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('throw an exception when the songinstrument already exists with different properties', async () => {
    const songinstrument = SongInstrumentMother.create();
    const command = CreateSongInstrumentCommandMother.create(); // Completely different random command

    testCase.shouldSearch(SongInstrumentIdMother.create(command.id), songinstrument); // Mock that search by command ID returns a different model
    await testCase.assertSaveException(command, commandHandler, SongInstrumentExistException);
  });
});
