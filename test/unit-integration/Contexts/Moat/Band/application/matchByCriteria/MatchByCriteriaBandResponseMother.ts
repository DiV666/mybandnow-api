import { MatchByCriteriaBandResponse } from '@Contexts/Moat/Band/application/matchByCriteria/MatchByCriteriaBandResponse.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';

export class MatchByCriteriaBandResponseMother {
  static fromModelList(models: Array<Band>, total?: number): MatchByCriteriaBandResponse {
    return new MatchByCriteriaBandResponse(models, total ?? models.length);
  }
}
