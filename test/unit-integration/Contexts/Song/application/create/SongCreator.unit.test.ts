import { beforeEach, describe, it } from 'vitest';
import { CreateSongCommandHandler } from '@Contexts/Song/application/create/CreateSongCommandHandler.js';
import { SongCreator } from '@Contexts/Song/application/create/SongCreator.js';
import { SongExistException } from '@Contexts/Song/domain/exception/SongExistException.js';
import { SongMother } from '../../domain/SongMother.js';
import { SongCreatedDomainEventMother } from '../../domain/SongCreatedDomainEventMother.js';
import { CreateSongCommandMother } from './CreateSongCommandMother.js';
import { SongCreatorTestCase } from './SongCreatorTestCase.js';

describe('SongCreator should', () => {
  let testCase: SongCreatorTestCase;
  let commandHandler: CreateSongCommandHandler;

  beforeEach(() => {
    testCase = new SongCreatorTestCase();
    const useCase = new SongCreator(testCase.logger(), testCase.persistenceRepository(), testCase.eventBus());
    commandHandler = new CreateSongCommandHandler(useCase);
  });

  it('create a valid song with its original videoclip url stored in the song aggregate', async () => {
    const song = SongMother.create();
    const command = CreateSongCommandMother.fromModel(song);
    const domainEvent = SongCreatedDomainEventMother.fromModel(song);

    testCase.shouldSearch(song.id);
    testCase.shouldSave(song);
    testCase.shouldPublishDomainEvent(domainEvent);

    await testCase.dispatch(command, commandHandler);

    testCase.assertSave(null);
    testCase.assertPublishDomainEvent(null);
  });

  it('throw an exception when the song already exists', async () => {
    const song = SongMother.create();
    const command = CreateSongCommandMother.create({ id: song.id.value });

    testCase.shouldSearch(song.id, song);

    await testCase.assertSaveException(command, commandHandler, SongExistException);
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });
});
