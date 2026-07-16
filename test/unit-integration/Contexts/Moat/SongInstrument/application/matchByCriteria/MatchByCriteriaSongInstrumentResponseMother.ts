import { MatchByCriteriaSongInstrumentResponse } from '@Contexts/Moat/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentResponse.js';
import { SongInstrument } from '@Contexts/Moat/SongInstrument/domain/SongInstrument.js';

export class MatchByCriteriaSongInstrumentResponseMother {
  static fromModelList(models: Array<SongInstrument>, total?: number): MatchByCriteriaSongInstrumentResponse {
    return new MatchByCriteriaSongInstrumentResponse(
      models.map((songInstrument) => ({ songInstrument, upload: null })),
      total ?? models.length
    );
  }
}
