import { describe, it, beforeEach, expect } from 'vitest';
import { MusicianCreator } from '@Contexts/Moat/Musician/application/create/MusicianCreator.js';
import { MusicianMother } from '../../domain/MusicianMother.js';
import { CreateMusicianCommandMother } from './CreateMusicianCommandMother.js';
import { CreateMusicianCommandHandler } from '@Contexts/Moat/Musician/application/create/CreateMusicianCommandHandler.js';
import { MusicianCreatorTestCase } from './MusicianCreatorTestCase.js';
import { MusicianCreatedDomainEventMother } from '../../domain/MusicianCreatedDomainEventMother.js';
import { MusicianExistException } from '@Contexts/Moat/Musician/domain/exception/MusicianExistException.js';
import { MusicianId } from '@Contexts/Moat/Musician/domain/value-object/MusicianId.js';

describe('MusicianCreator should', () => {
  let testCase: MusicianCreatorTestCase;
  let commandHandler: CreateMusicianCommandHandler;

  beforeEach(() => {
    testCase = new MusicianCreatorTestCase();
    const useCase = new MusicianCreator(
      testCase.logger(),
      testCase.persistenceRepository(),
      testCase.eventBus(),
      testCase.clock()
    );
    commandHandler = new CreateMusicianCommandHandler(useCase);
  });

  it('create a valid musician', async () => {
    const musician = MusicianMother.create();
    const command = CreateMusicianCommandMother.fromModel(musician);
    const domainEvent = MusicianCreatedDomainEventMother.fromModel(musician);

    testCase.shouldSearch(musician.id); // Ensure it doesn't exist
    testCase.shouldSave(musician);
    testCase.shouldPublishDomainEvent(domainEvent, ['attributes.createdAt', 'attributes.updatedAt']);

    await testCase.dispatch(command, commandHandler);
    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('return success when the musician already exists with the same properties (idempotency)', async () => {
    const musician = MusicianMother.create();
    const command = CreateMusicianCommandMother.fromModel(musician);

    testCase.shouldSearch(musician.id, musician); // Mock that it exists
    await testCase.dispatch(command, commandHandler);

    // In idempotency case, the model is not saved again
    expect(testCase.persistenceRepository().save).not.toHaveBeenCalled();
  });

  it('throw an exception when the musician already exists with different properties', async () => {
    const musician = MusicianMother.create();
    const command = CreateMusicianCommandMother.create(); // Completely different random command

    testCase.shouldSearch(new MusicianId(command.id), musician); // Mock that search by command ID returns a different model
    await testCase.assertSaveException(command, commandHandler, MusicianExistException);
  });
});
