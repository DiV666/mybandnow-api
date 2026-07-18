import { MatchByCriteriaInstrumentsResponse } from '@Contexts/Moat/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsResponse.js';
import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';

export class MatchByCriteriaInstrumentsResponseMother {
  static fromModelList(models: Array<Instruments>, total?: number): MatchByCriteriaInstrumentsResponse {
    return new MatchByCriteriaInstrumentsResponse(models, total ?? models.length);
  }
}
