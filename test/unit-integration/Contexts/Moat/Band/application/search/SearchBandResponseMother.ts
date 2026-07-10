import { SearchBandResponse } from '@Contexts/Moat/Band/application/search/SearchBandResponse.js';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';

export class SearchBandResponseMother {
  static fromModel(model: Band): SearchBandResponse {
    return new SearchBandResponse(model);
  }
}
