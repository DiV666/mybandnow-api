import { SearchInstrumentsResponse } from '@Contexts/Instruments/application/search/SearchInstrumentsResponse.js';
import { Instruments } from '@Contexts/Instruments/domain/Instruments.js';

export class SearchInstrumentsResponseMother {
  static fromModel(model: Instruments): SearchInstrumentsResponse {
    return new SearchInstrumentsResponse(model);
  }
}
