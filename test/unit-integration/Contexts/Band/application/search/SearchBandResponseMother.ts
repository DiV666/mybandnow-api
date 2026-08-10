import { SearchBandResponse } from '@Contexts/Band/application/search/SearchBandResponse.js';
import { Band } from '@Contexts/Band/domain/Band.js';

export class SearchBandResponseMother {
  static fromModel(model: Band): SearchBandResponse {
    return new SearchBandResponse(model);
  }
}
