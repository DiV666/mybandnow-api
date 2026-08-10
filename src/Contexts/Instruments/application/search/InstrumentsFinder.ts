import { InstrumentsPersistenceRepository } from '../../domain/repository/InstrumentsPersistenceRepository.js';
import { InstrumentsNotExistException } from '../../domain/exception/InstrumentsNotExistException.js';
import { SearchInstrumentsResponse } from './SearchInstrumentsResponse.js';
import { InstrumentsId } from '../../domain/value-object/InstrumentsId.js';

export class InstrumentsFinder {
  constructor(private repository: InstrumentsPersistenceRepository) {}

  async run({ id }: { id: string }): Promise<SearchInstrumentsResponse> {
    const model = await this.repository.search(new InstrumentsId(id));

    if (!model) {
      throw new InstrumentsNotExistException(id);
    }

    return new SearchInstrumentsResponse(model);
  }
}
