import { describe, it, beforeEach } from 'vitest';
import { SongInstrumentVideoCreator } from '@Contexts/Moat/SongInstrumentVideo/application/create/SongInstrumentVideoCreator.js';
import { SongInstrumentVideoMother } from '../../domain/SongInstrumentVideoMother.js';
import { SongInstrumentVideoIdMother } from '../../domain/SongInstrumentVideoIdMother.js';
import { CreateSongInstrumentVideoCommandMother } from './CreateSongInstrumentVideoCommandMother.js';
import { CreateSongInstrumentVideoCommandHandler } from '@Contexts/Moat/SongInstrumentVideo/application/create/CreateSongInstrumentVideoCommandHandler.js';
import { SongInstrumentVideoCreatorTestCase } from './SongInstrumentVideoCreatorTestCase.js';
import { SongInstrumentVideoCreatedDomainEventMother } from '../../domain/SongInstrumentVideoCreatedDomainEventMother.js';
import { SongInstrumentVideoExistException } from '@Contexts/Moat/SongInstrumentVideo/domain/exception/SongInstrumentVideoExistException.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/Moat/SongInstrument/domain/SongInstrumentMother.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';

describe('SongInstrumentVideoCreator should', () => {
  let testCase: SongInstrumentVideoCreatorTestCase;
  let commandHandler: CreateSongInstrumentVideoCommandHandler;

  beforeEach(() => {
    testCase = new SongInstrumentVideoCreatorTestCase();
    const useCase = new SongInstrumentVideoCreator(
      testCase.logger(),
      testCase.persistenceRepository(),
      testCase.eventBus(),
      testCase.clock(),
      testCase.songInstrumentRepository()
    );
    commandHandler = new CreateSongInstrumentVideoCommandHandler(useCase);
  });

  it('create a valid songinstrumentvideo', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);
    const domainEvent = SongInstrumentVideoCreatedDomainEventMother.fromModel(songinstrumentvideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value)
    });

    testCase.shouldSearch(songinstrumentvideo.id); // Ensure it doesn't exist
    testCase.shouldSearchSongInstrument(
      new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      songInstrument
    );
    testCase.shouldSave(songinstrumentvideo);
    testCase.shouldPublishDomainEvent(domainEvent, ['attributes.createdAt', 'attributes.updatedAt']);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('return success when the songinstrumentvideo already exists with the same properties (idempotency)', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);

    testCase.shouldSearch(songinstrumentvideo.id, songinstrumentvideo); // Mock that it exists
    await testCase.dispatch(command, commandHandler);
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('throw an exception when the songinstrumentvideo already exists with different properties', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.create(); // Completely different random command

    testCase.shouldSearch(SongInstrumentVideoIdMother.create(command.id), songinstrumentvideo); // Mock that search by command ID returns a different model
    await testCase.assertSaveException(command, commandHandler, SongInstrumentVideoExistException);
  });

  it('throw an exception when the song instrument does not exist', async () => {
    const command = CreateSongInstrumentVideoCommandMother.create();

    testCase.shouldSearch(SongInstrumentVideoIdMother.create(command.id));
    testCase.shouldSearchSongInstrument(new SongInstrumentId(command.songInstrumentId));

    await testCase.assertSaveException(command, commandHandler, SongInstrumentNotExistException);
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });
});
