import { describe, it, beforeEach, expect } from 'vitest';
import { MusicianCreator } from '@Contexts/Moat/Musician/application/create/MusicianCreator.js';
import { MusicianMother } from '../../domain/MusicianMother.js';
import { CreateMusicianCommandMother } from './CreateMusicianCommandMother.js';
import { CreateMusicianCommandHandler } from '@Contexts/Moat/Musician/application/create/CreateMusicianCommandHandler.js';
import { MusicianCreatorTestCase } from './MusicianCreatorTestCase.js';
import { MusicianCreatedDomainEventMother } from '../../domain/MusicianCreatedDomainEventMother.js';
import { MusicianExistException } from '@Contexts/Moat/Musician/domain/exception/MusicianExistException.js';
import { MusicianId } from '@Contexts/Moat/Musician/domain/value-object/MusicianId.js';
import { MusicianUsername } from '@Contexts/Moat/Musician/domain/value-object/MusicianUsername.js';
import { MusicianUsernameAlreadyExistsException } from '@Contexts/Moat/Musician/domain/exception/MusicianUsernameAlreadyExistsException.js';
import { MusicianUserAlreadyHasProfileException } from '@Contexts/Moat/Musician/domain/exception/MusicianUserAlreadyHasProfileException.js';

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
    testCase.shouldSearchByUsername(musician.username);
    testCase.shouldSearchByUserId(musician.userId);
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

  it('throw an exception when the username already exists for another musician', async () => {
    const existingMusician = MusicianMother.create();
    const command = CreateMusicianCommandMother.create({ username: existingMusician.username.value });

    testCase.shouldSearch(new MusicianId(command.id));
    testCase.shouldSearchByUsername(existingMusician.username, existingMusician);

    await testCase.assertSaveException(command, commandHandler, MusicianUsernameAlreadyExistsException);
  });

  it('throw an exception when the user already has a musician profile', async () => {
    const existingMusician = MusicianMother.create();
    const command = CreateMusicianCommandMother.create({ userId: existingMusician.userId.value });

    testCase.shouldSearch(new MusicianId(command.id));
    testCase.shouldSearchByUsername(new MusicianUsername(command.username));
    testCase.shouldSearchByUserId(existingMusician.userId, existingMusician);

    await testCase.assertSaveException(command, commandHandler, MusicianUserAlreadyHasProfileException);
  });
});
