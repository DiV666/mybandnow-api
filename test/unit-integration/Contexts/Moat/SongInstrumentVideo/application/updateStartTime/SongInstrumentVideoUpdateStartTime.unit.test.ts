import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SongInstrumentVideoUpdateStartTime } from '@Contexts/Moat/SongInstrumentVideo/application/updateStartTime/SongInstrumentVideoUpdateStartTime.js';
import { SongInstrumentVideoUpdateStartTimeCommand } from '@Contexts/Moat/SongInstrumentVideo/application/updateStartTime/SongInstrumentVideoUpdateStartTimeCommand.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { SongInstrumentVideoPersistenceRepository } from '@Contexts/Moat/SongInstrumentVideo/domain/repository/SongInstrumentVideoPersistenceRepository.js';
import type { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/Moat/SongInstrument/domain/SongInstrumentMother.js';
import { SongInstrumentVideoMother } from '@Test/unit-integration/Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideoMother.js';
import { SongInstrumentVideoSongInstrumentId } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { SongInstrumentVideoNotExistException } from '@Contexts/Moat/SongInstrumentVideo/domain/exception/SongInstrumentVideoNotExistException.js';

describe('SongInstrumentVideoUpdateStartTime', () => {
  it('updates the persisted sync start time when the authenticated musician belongs to the band', async () => {
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const useCase = new SongInstrumentVideoUpdateStartTime(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      eventBus
    );
    const songInstrument = SongInstrumentMother.create();
    const songInstrumentVideo = SongInstrumentVideoMother.create({
      songInstrumentId: new SongInstrumentVideoSongInstrumentId(songInstrument.id.value)
    });
    const command = new SongInstrumentVideoUpdateStartTimeCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      songInstrument.musicianId.value,
      1200
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    songInstrumentVideoRepository.searchBySongInstrumentId.mockResolvedValue(songInstrumentVideo);

    await useCase.run(command);

    expect(songInstrumentVideoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        startTimeMs: expect.objectContaining({ value: 1200 })
      })
    );
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('does not persist when the start time is unchanged', async () => {
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const useCase = new SongInstrumentVideoUpdateStartTime(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      eventBus
    );
    const songInstrument = SongInstrumentMother.create();
    const songInstrumentVideo = SongInstrumentVideoMother.create({
      songInstrumentId: new SongInstrumentVideoSongInstrumentId(songInstrument.id.value)
    });
    const command = new SongInstrumentVideoUpdateStartTimeCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      songInstrument.musicianId.value,
      songInstrumentVideo.startTimeMs.value
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    songInstrumentVideoRepository.searchBySongInstrumentId.mockResolvedValue(songInstrumentVideo);

    await useCase.run(command);

    expect(songInstrumentVideoRepository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws when the song instrument video does not exist', async () => {
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const useCase = new SongInstrumentVideoUpdateStartTime(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      eventBus
    );
    const songInstrument = SongInstrumentMother.create();
    const command = new SongInstrumentVideoUpdateStartTimeCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      songInstrument.musicianId.value,
      400
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    songInstrumentVideoRepository.searchBySongInstrumentId.mockResolvedValue(null);

    await expect(useCase.run(command)).rejects.toThrow(SongInstrumentVideoNotExistException);
  });
});
