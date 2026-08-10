import { MatchByCriteriaInstrumentsResponse } from '@Contexts/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsResponse.js';
import { Instruments } from '@Contexts/Instruments/domain/Instruments.js';

export class MatchByCriteriaInstrumentsResponseMother {
  static fromModelList(models: Array<Instruments>, total?: number): MatchByCriteriaInstrumentsResponse {
    return new MatchByCriteriaInstrumentsResponse(models, total ?? models.length);
  }
}
