import { SearchInstrumentsResponse } from '@Contexts/Moat/Instruments/application/search/SearchInstrumentsResponse.js';
import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';

export class SearchInstrumentsResponseMother {
  static fromModel(model: Instruments): SearchInstrumentsResponse {
    return new SearchInstrumentsResponse(model);
  }
}
