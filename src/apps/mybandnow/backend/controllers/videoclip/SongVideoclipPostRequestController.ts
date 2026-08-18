import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { Context } from 'openapi-backend';
import { MusicianSearchByUserIdQuery } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { SongFindByIdQuery } from '@Contexts/Song/application/findById/SongFindByIdQuery.js';
import { SongFindByIdResponse } from '@Contexts/Song/application/findById/SongFindByIdResponse.js';
import { SongNotExistException } from '@Contexts/Song/domain/exception/SongNotExistException.js';
import { MatchByCriteriaSongInstrumentQuery } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentQuery.js';
import { MatchByCriteriaSongInstrumentResponse } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentResponse.js';
import { FindSongInstrumentVideoBySongInstrumentIdQuery } from '@Contexts/SongInstrument/Video/application/findBySongInstrumentId/FindSongInstrumentVideoBySongInstrumentIdQuery.js';
import { FindSongInstrumentVideoBySongInstrumentIdResponse } from '@Contexts/SongInstrument/Video/application/findBySongInstrumentId/FindSongInstrumentVideoBySongInstrumentIdResponse.js';
import { SearchInstrumentsQuery } from '@Contexts/Instruments/application/search/SearchInstrumentsQuery.js';
import { SearchInstrumentsResponse } from '@Contexts/Instruments/application/search/SearchInstrumentsResponse.js';
import { RequestVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/request/RequestVideoclipCommand.js';
import { VideoclipProcessAlreadyRequestedException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessAlreadyRequestedException.js';
import { IncompleteSongInstrumentsException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/IncompleteSongInstrumentsException.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import ApiController from '@Contexts/Shared/infrastructure/Express/ApiController.js';

interface SongVideoclipRequestBody {
  id: string;
}

export default class SongVideoclipPostRequestController extends ApiController {
  async run(context: Context, req: Request, res: Response): Promise<void> {
    const authenticatedUserId = context.security.BearerAuth.id as string;
    const songId = context.request.params.songId as string;
    const { id } = req.body as SongVideoclipRequestBody;

    const musicianResponse = await this.queryBus.ask<MusicianSearchByUserIdResponse>(
      new MusicianSearchByUserIdQuery(authenticatedUserId)
    );

    if (!musicianResponse.musician) {
      throw new ForbiddenException('Profile required');
    }

    const songResponse = await this.queryBus.ask<SongFindByIdResponse>(new SongFindByIdQuery(songId));

    if (!songResponse.song) {
      throw new SongNotExistException(songId);
    }

    const { originalVideoclipUrl } = songResponse.song;

    const songInstrumentsResponse = await this.queryBus.ask<MatchByCriteriaSongInstrumentResponse>(
      new MatchByCriteriaSongInstrumentQuery(
        songId,
        musicianResponse.musician.id,
        new Criteria(Filters.none(), Order.none())
      )
    );

    const { items: songInstruments } = songInstrumentsResponse.toPrimitives();

    const instruments = await Promise.all(
      songInstruments.map(async (songInstrument) => {
        const videoResponse = await this.queryBus.ask<FindSongInstrumentVideoBySongInstrumentIdResponse>(
          new FindSongInstrumentVideoBySongInstrumentIdQuery(songInstrument.id)
        );

        const instrumentResponse = await this.queryBus.ask<SearchInstrumentsResponse>(
          new SearchInstrumentsQuery(songInstrument.instrumentId)
        );

        return {
          songInstrumentId: songInstrument.id,
          videoUrl: videoResponse.video ? videoResponse.video.url : null,
          instrumentName: instrumentResponse.toPrimitives().name,
          startTimeMs: videoResponse.video ? videoResponse.video.startTimeMs : 0
        };
      })
    );

    await this.commandBus.dispatch(new RequestVideoclipCommand(id, songId, originalVideoclipUrl, instruments));

    res.status(httpStatus.ACCEPTED).end();
  }

  exceptions(): Record<string, number> {
    return {
      [SongNotExistException.name]: httpStatus.NOT_FOUND,
      [InvalidArgumentException.name]: httpStatus.BAD_REQUEST,
      [IncompleteSongInstrumentsException.name]: httpStatus.BAD_REQUEST,
      [VideoclipProcessAlreadyRequestedException.name]: httpStatus.CONFLICT
    };
  }
}
