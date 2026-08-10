import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { Request, Response } from 'express';
import type { Context } from 'openapi-backend';
import httpStatus from 'http-status';
import type Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import type { CommandBus } from '../../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type { QueryBus } from '../../../../../../../src/Contexts/Shared/domain/QueryBus.js';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import SongInstrumentGetByIdController from '../../../../../../../src/apps/mybandnow/backend/controllers/songInstrument/SongInstrumentGetByIdController.js';
import { MusicianSearchByUserIdQuery } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '../../../../../../../src/Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongInstrumentFindByIdQuery } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/findById/SongInstrumentFindByIdQuery.js';
import { SongInstrumentFindByIdResponse } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/findById/SongInstrumentFindByIdResponse.js';
import { SongInstrumentMother } from '../../../../../../../test/unit-integration/Contexts/SongInstrument/SongInstrument/domain/SongInstrumentMother.js';
import { SongInstrumentVideoMother } from '../../../../../../../test/unit-integration/Contexts/SongInstrument/Video/domain/SongInstrumentVideoMother.js';
import { SongInstrumentVideoSongInstrumentId } from '../../../../../../../src/Contexts/SongInstrument/Video/domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { ForbiddenException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('SongInstrumentGetByIdController', () => {
  it('returns the requested song instrument for an authenticated band member', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentGetByIdController(logger, commandBus, queryBus, exceptionHandler);
    const songInstrument = SongInstrumentMother.create();
    const responseBody = new SongInstrumentFindByIdResponse(songInstrument.toPrimitives(), null);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: songInstrument.songId.value,
          songInstrumentId: songInstrument.id.value
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'band-member-musician-id',
          userId: 'authenticated-user-id',
          username: 'band-member',
          name: 'Band Member'
        })
      )
      .mockResolvedValueOnce(responseBody);

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(queryBus.ask).toHaveBeenNthCalledWith(1, new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(queryBus.ask).toHaveBeenNthCalledWith(
      2,
      new SongInstrumentFindByIdQuery(songInstrument.songId.value, songInstrument.id.value, 'band-member-musician-id')
    );
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(responseBody);
  });

  it('returns the signed playback url in the API response when the instrument has a processed video', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentGetByIdController(logger, commandBus, queryBus, exceptionHandler);
    const songInstrument = SongInstrumentMother.create();
    const signedPlaybackUrl =
      'https://storage.googleapis.com/tmp-bucket/song-instrument-uploads/video.mp4?signature=123';
    const video = SongInstrumentVideoMother.create({
      songInstrumentId: new SongInstrumentVideoSongInstrumentId(songInstrument.id.value),
      url: { value: signedPlaybackUrl } as never
    });
    const responseBody = new SongInstrumentFindByIdResponse(songInstrument.toPrimitives(), video.toPrimitives());

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: songInstrument.songId.value,
          songInstrumentId: songInstrument.id.value
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    res.status.mockReturnValue(res);
    queryBus.ask
      .mockResolvedValueOnce(
        new MusicianSearchByUserIdResponse({
          id: 'band-member-musician-id',
          userId: 'authenticated-user-id',
          username: 'band-member',
          name: 'Band Member'
        })
      )
      .mockResolvedValueOnce(responseBody);

    // Act
    await controller.run(context, req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(httpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: songInstrument.id.value,
        video: expect.objectContaining({
          url: signedPlaybackUrl,
          startTimeMs: 0
        })
      })
    );
  });

  it('throws forbidden when the authenticated user has no musician profile', async () => {
    // Arrange
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const queryBus = mock<QueryBus>();
    const exceptionHandler = new ApiExceptionsHttpStatusCodeMapping();
    const controller = new SongInstrumentGetByIdController(logger, commandBus, queryBus, exceptionHandler);

    const context = {
      security: {
        BearerAuth: {
          id: 'authenticated-user-id'
        }
      },
      request: {
        params: {
          songId: '4da5fa54-261c-41ee-bdcb-c1d339820316',
          songInstrumentId: '49040ff8-d099-49d6-a2a7-f342c7910b26'
        }
      }
    } as unknown as Context;
    const req = mock<Request>();
    const res = mock<Response>();
    queryBus.ask.mockResolvedValueOnce(new MusicianSearchByUserIdResponse(null));

    // Act / Assert
    await expect(controller.run(context, req, res)).rejects.toThrow(ForbiddenException);
    expect(queryBus.ask).toHaveBeenCalledExactlyOnceWith(new MusicianSearchByUserIdQuery('authenticated-user-id'));
    expect(res.status).not.toHaveBeenCalled();
  });
});
