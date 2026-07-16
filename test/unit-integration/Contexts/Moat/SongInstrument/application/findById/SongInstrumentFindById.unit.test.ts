import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SongInstrumentFindById } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindById.js';
import { SongInstrumentFindByIdQuery } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindByIdQuery.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { SongInstrumentVideoPersistenceRepository } from '@Contexts/Moat/SongInstrumentVideo/domain/repository/SongInstrumentVideoPersistenceRepository.js';
import type { SongInstrumentUploadPersistenceRepository } from '@Contexts/Moat/SongInstrumentUpload/domain/repository/SongInstrumentUploadPersistenceRepository.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/Moat/SongInstrument/domain/SongInstrumentMother.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentSongId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentSongId.js';
import { SongInstrumentMusicianId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentFindByIdResponse } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindByIdResponse.js';
import { SongInstrumentVideoSongInstrumentId } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { SongInstrumentVideoMother } from '@Test/unit-integration/Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideoMother.js';
import { SongInstrumentUploadMother } from '@Test/unit-integration/Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusValues } from '@Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('SongInstrumentFindById', () => {
  it('returns the song instrument with a null video when the authenticated musician belongs to the song band', async () => {
    // Arrange
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const songInstrumentUploadRepository = mock<SongInstrumentUploadPersistenceRepository>();
    const useCase = new SongInstrumentFindById(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      songInstrumentUploadRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const query = new SongInstrumentFindByIdQuery(
      songInstrument.songId.value,
      songInstrument.id.value,
      'd355c62d-e0e2-4ba7-b61c-e4bba8bc1807'
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    songInstrumentVideoRepository.searchBySongInstrumentId.mockResolvedValue(null);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(authorizationRepository.isBandMember).toHaveBeenCalledExactlyOnceWith(
      new SongInstrumentSongId(query.songId),
      new SongInstrumentMusicianId(query.musicianId)
    );
    expect(songInstrumentRepository.search).toHaveBeenCalledExactlyOnceWith(new SongInstrumentId(query.instrumentId));
    expect(songInstrumentVideoRepository.searchBySongInstrumentId).toHaveBeenCalledExactlyOnceWith(
      new SongInstrumentVideoSongInstrumentId(query.instrumentId)
    );
    expect(response).toEqual(new SongInstrumentFindByIdResponse(songInstrument.toPrimitives(), null));
    expect(response).toMatchObject({ upload: null });
  });

  it('returns the song instrument video when one exists for the requested instrument', async () => {
    // Arrange
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const songInstrumentUploadRepository = mock<SongInstrumentUploadPersistenceRepository>();
    const useCase = new SongInstrumentFindById(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      songInstrumentUploadRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const video = SongInstrumentVideoMother.create({
      songInstrumentId: new SongInstrumentVideoSongInstrumentId(songInstrument.id.value)
    });
    const query = new SongInstrumentFindByIdQuery(
      songInstrument.songId.value,
      songInstrument.id.value,
      songInstrument.musicianId.value
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    songInstrumentVideoRepository.searchBySongInstrumentId.mockResolvedValue(video);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(response).toEqual(new SongInstrumentFindByIdResponse(songInstrument.toPrimitives(), video.toPrimitives()));
  });

  it('returns the active failed upload status with its public error message', async () => {
    // Arrange
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const songInstrumentUploadRepository = mock<SongInstrumentUploadPersistenceRepository>();
    const useCase = Reflect.construct(SongInstrumentFindById, [
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      songInstrumentUploadRepository
    ]) as SongInstrumentFindById;
    const activeUpload = SongInstrumentUploadMother.create({
      status: { value: SongInstrumentUploadStatusValues.FAILED } as never
    });
    const songInstrumentWithActiveUpload = SongInstrumentMother.create({
      activeUploadAttemptId: { value: activeUpload.id.value } as never
    });
    const failedUpload = SongInstrumentUploadMother.create({
      id: activeUpload.id,
      status: { value: SongInstrumentUploadStatusValues.FAILED } as never,
      errorMessage: { value: 'Upload processing failed. Please try again.' } as never
    });
    const query = new SongInstrumentFindByIdQuery(
      songInstrumentWithActiveUpload.songId.value,
      songInstrumentWithActiveUpload.id.value,
      songInstrumentWithActiveUpload.musicianId.value
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrumentWithActiveUpload);
    songInstrumentVideoRepository.searchBySongInstrumentId.mockResolvedValue(null);
    songInstrumentUploadRepository.search.mockResolvedValue(failedUpload);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(songInstrumentUploadRepository.search).toHaveBeenCalledOnce();
    expect(response).toMatchObject({
      upload: {
        status: SongInstrumentUploadStatusValues.FAILED,
        errorMessage: 'Upload processing failed. Please try again.'
      }
    });
  });

  it('throws not found when the instrument belongs to a different song', async () => {
    // Arrange
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const songInstrumentUploadRepository = mock<SongInstrumentUploadPersistenceRepository>();
    const useCase = new SongInstrumentFindById(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      songInstrumentUploadRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const query = new SongInstrumentFindByIdQuery(
      '0f53af4e-bc6f-4705-bd91-7313b9f3562f',
      songInstrument.id.value,
      songInstrument.musicianId.value
    );

    authorizationRepository.isBandMember.mockResolvedValue(true);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);

    // Act / Assert
    await expect(useCase.run(query)).rejects.toThrow(SongInstrumentNotExistException);
    expect(authorizationRepository.isBandMember).toHaveBeenCalledExactlyOnceWith(
      new SongInstrumentSongId(query.songId),
      new SongInstrumentMusicianId(query.musicianId)
    );
    expect(songInstrumentVideoRepository.searchBySongInstrumentId).not.toHaveBeenCalled();
  });

  it('throws forbidden when the authenticated musician does not belong to the band', async () => {
    // Arrange
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songInstrumentVideoRepository = mock<SongInstrumentVideoPersistenceRepository>();
    const songInstrumentUploadRepository = mock<SongInstrumentUploadPersistenceRepository>();
    const useCase = new SongInstrumentFindById(
      songInstrumentRepository,
      authorizationRepository,
      songInstrumentVideoRepository,
      songInstrumentUploadRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const query = new SongInstrumentFindByIdQuery(
      songInstrument.songId.value,
      songInstrument.id.value,
      songInstrument.musicianId.value
    );

    authorizationRepository.isBandMember.mockResolvedValue(false);

    // Act / Assert
    await expect(useCase.run(query)).rejects.toThrow(ForbiddenException);
    expect(songInstrumentRepository.search).not.toHaveBeenCalled();
    expect(songInstrumentVideoRepository.searchBySongInstrumentId).not.toHaveBeenCalled();
  });
});
