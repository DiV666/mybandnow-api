import { describe, it, beforeEach, expect, vi } from 'vitest';
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
import { SongInstrumentActiveUploadAttemptId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentActiveUploadAttemptId.js';

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
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(songinstrumentvideo.id.value)
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

    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(songinstrumentvideo.id.value)
    });

    testCase.shouldSearchSongInstrument(
      new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      songInstrument
    );
    testCase.shouldSearch(songinstrumentvideo.id, songinstrumentvideo); // Mock that it exists
    await testCase.dispatch(command, commandHandler);
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('throw an exception when the songinstrumentvideo already exists with different properties', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.create(); // Completely different random command

    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(command.songInstrumentId),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(command.id)
    });

    testCase.shouldSearchSongInstrument(new SongInstrumentId(command.songInstrumentId), songInstrument);
    testCase.shouldSearch(SongInstrumentVideoIdMother.create(command.id), songinstrumentvideo); // Mock that search by command ID returns a different model
    await testCase.assertSaveException(command, commandHandler, SongInstrumentVideoExistException);
  });

  it('return success without updating anything when a stale upload attempt completes after a newer active attempt', async () => {
    const staleSongInstrumentVideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(staleSongInstrumentVideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(staleSongInstrumentVideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(SongInstrumentVideoIdMother.random().value)
    });

    vi.mocked(testCase.persistenceRepository().search).mockResolvedValueOnce(null);
    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(songInstrument);

    await testCase.dispatch(command, commandHandler);

    expect(testCase.persistenceRepository().searchBySongInstrumentId).not.toHaveBeenCalled();
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('updates the current song instrument video when a newer active upload completes', async () => {
    const currentSongInstrumentVideo = SongInstrumentVideoMother.create();
    const replacementSongInstrumentVideo = SongInstrumentVideoMother.create({
      songInstrumentId: currentSongInstrumentVideo.songInstrumentId,
      url: SongInstrumentVideoMother.create().url,
      duration: SongInstrumentVideoMother.create().duration,
      size: SongInstrumentVideoMother.create().size
    });
    const command = CreateSongInstrumentVideoCommandMother.fromModel(replacementSongInstrumentVideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(replacementSongInstrumentVideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(replacementSongInstrumentVideo.id.value)
    });

    vi.mocked(testCase.persistenceRepository().search).mockResolvedValueOnce(null);
    vi.mocked(testCase.persistenceRepository().searchBySongInstrumentId).mockResolvedValueOnce(
      currentSongInstrumentVideo
    );
    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(songInstrument);
    vi.mocked(testCase.persistenceRepository().save).mockResolvedValueOnce(undefined);

    await testCase.dispatch(command, commandHandler);

    expect(testCase.persistenceRepository().save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: currentSongInstrumentVideo.id,
        songInstrumentId: currentSongInstrumentVideo.songInstrumentId,
        url: replacementSongInstrumentVideo.url,
        duration: replacementSongInstrumentVideo.duration,
        size: replacementSongInstrumentVideo.size
      })
    );
    testCase.assertPublishDomainEventNotCalled();
  });

  it('return success when save races with another identical replay and the persisted video matches the command', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(songinstrumentvideo.id.value)
    });

    vi.mocked(testCase.persistenceRepository().search)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(songinstrumentvideo);
    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(songInstrument);
    vi.mocked(testCase.persistenceRepository().save).mockRejectedValueOnce(
      new SongInstrumentVideoExistException(songinstrumentvideo.id.value)
    );

    await testCase.dispatch(command, commandHandler);

    expect(testCase.persistenceRepository().save).toHaveBeenCalledOnce();
    testCase.assertPublishDomainEventNotCalled();
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
