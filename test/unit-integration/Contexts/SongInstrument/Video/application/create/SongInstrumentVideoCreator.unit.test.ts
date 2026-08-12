import { describe, it, beforeEach, expect, vi } from 'vitest';
import { SongInstrumentVideoCreator } from '@Contexts/SongInstrument/Video/application/create/SongInstrumentVideoCreator.js';
import { SongInstrumentVideoMother } from '../../domain/SongInstrumentVideoMother.js';
import { SongInstrumentVideoIdMother } from '../../domain/SongInstrumentVideoIdMother.js';
import { CreateSongInstrumentVideoCommandMother } from './CreateSongInstrumentVideoCommandMother.js';
import { CreateSongInstrumentVideoCommandHandler } from '@Contexts/SongInstrument/Video/application/create/CreateSongInstrumentVideoCommandHandler.js';
import { SongInstrumentVideoCreatorTestCase } from './SongInstrumentVideoCreatorTestCase.js';
import { SongInstrumentVideoCreatedDomainEventMother } from '../../domain/SongInstrumentVideoCreatedDomainEventMother.js';
import { SongInstrumentVideoExistException } from '@Contexts/SongInstrument/Video/domain/exception/SongInstrumentVideoExistException.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/SongInstrument/SongInstrument/domain/SongInstrumentMother.js';
import { SongInstrumentId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentActiveUploadAttemptId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentActiveUploadAttemptId.js';

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

  it('log success only after save and publish succeed', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(songinstrumentvideo.id.value)
    });
    const calls: string[] = [];

    vi.mocked(testCase.persistenceRepository().search).mockResolvedValueOnce(null);
    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(songInstrument);
    vi.mocked(testCase.persistenceRepository().searchBySongInstrumentId).mockResolvedValueOnce(null);
    vi.mocked(testCase.persistenceRepository().save).mockImplementationOnce(async () => {
      calls.push('save');
    });
    vi.mocked(testCase.eventBus().publish).mockImplementationOnce(async () => {
      calls.push('publish');
    });
    vi.mocked(testCase.logger().info).mockImplementationOnce(() => {
      calls.push('log');
    });

    await testCase.dispatch(command, commandHandler);

    expect(calls).toEqual(['save', 'publish', 'log']);
    expect(testCase.logger().info).toHaveBeenCalledWith(
      { id: songinstrumentvideo.id.value },
      'moat.songinstrumentvideo.create.success'
    );
  });

  it('not log success when publish fails after persistence', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(songinstrumentvideo.id.value)
    });
    const publishError = new Error('publish failed');

    vi.mocked(testCase.persistenceRepository().search).mockResolvedValueOnce(null);
    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(songInstrument);
    vi.mocked(testCase.persistenceRepository().searchBySongInstrumentId).mockResolvedValueOnce(null);
    vi.mocked(testCase.persistenceRepository().save).mockResolvedValueOnce(undefined);
    vi.mocked(testCase.eventBus().publish).mockRejectedValueOnce(publishError);

    await expect(testCase.dispatch(command, commandHandler)).rejects.toThrow(publishError);

    expect(testCase.logger().info).not.toHaveBeenCalled();
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

  it('publishes a replacement event after updating the current song instrument video with a newer active upload', async () => {
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
    expect(testCase.eventBus().publish).toHaveBeenCalledWith([
      expect.objectContaining({
        eventName: 'song_instrument.1.video.replaced',
        aggregateId: currentSongInstrumentVideo.id.value,
        attributes: {
          songInstrumentId: currentSongInstrumentVideo.songInstrumentId.value,
          oldUrl: currentSongInstrumentVideo.url.value,
          newUrl: replacementSongInstrumentVideo.url.value
        }
      })
    ]);
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

  it('return success when save races with an identical persisted video under a different id', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const persistedSongInstrumentVideo = SongInstrumentVideoMother.create({
      id: SongInstrumentVideoIdMother.random(),
      size: songinstrumentvideo.size,
      duration: songinstrumentvideo.duration,
      url: songinstrumentvideo.url,
      songInstrumentId: songinstrumentvideo.songInstrumentId
    });
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);
    const songInstrument = SongInstrumentMother.create({
      id: new SongInstrumentId(songinstrumentvideo.songInstrumentId.value),
      activeUploadAttemptId: new SongInstrumentActiveUploadAttemptId(songinstrumentvideo.id.value)
    });

    vi.mocked(testCase.persistenceRepository().search).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    vi.mocked(testCase.persistenceRepository().searchBySongInstrumentId)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(persistedSongInstrumentVideo);
    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(songInstrument);
    vi.mocked(testCase.persistenceRepository().save).mockRejectedValueOnce(
      new SongInstrumentVideoExistException(songinstrumentvideo.id.value)
    );

    await testCase.dispatch(command, commandHandler);

    expect(testCase.persistenceRepository().save).toHaveBeenCalledOnce();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('return success when a duplicate completion is replayed after the parent song instrument is no longer available', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);

    testCase.shouldSearchSongInstrument(new SongInstrumentId(songinstrumentvideo.songInstrumentId.value));
    testCase.shouldSearch(songinstrumentvideo.id, songinstrumentvideo);

    await testCase.dispatch(command, commandHandler);

    expect(testCase.persistenceRepository().searchBySongInstrumentId).not.toHaveBeenCalled();
    testCase.assertSaveNotCalled();
    testCase.assertPublishDomainEventNotCalled();
  });

  it('return success when a missing-parent replay matches a persisted video under a different id', async () => {
    const songinstrumentvideo = SongInstrumentVideoMother.create();
    const persistedSongInstrumentVideo = SongInstrumentVideoMother.create({
      id: SongInstrumentVideoIdMother.random(),
      size: songinstrumentvideo.size,
      duration: songinstrumentvideo.duration,
      url: songinstrumentvideo.url,
      songInstrumentId: songinstrumentvideo.songInstrumentId
    });
    const command = CreateSongInstrumentVideoCommandMother.fromModel(songinstrumentvideo);

    vi.mocked(testCase.songInstrumentRepository().search).mockResolvedValueOnce(null);
    vi.mocked(testCase.persistenceRepository().search).mockResolvedValueOnce(null);
    vi.mocked(testCase.persistenceRepository().searchBySongInstrumentId).mockResolvedValueOnce(
      persistedSongInstrumentVideo
    );

    await testCase.dispatch(command, commandHandler);

    expect(testCase.persistenceRepository().searchBySongInstrumentId).toHaveBeenCalledWith(
      new SongInstrumentId(songinstrumentvideo.songInstrumentId.value)
    );
    testCase.assertSaveNotCalled();
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
