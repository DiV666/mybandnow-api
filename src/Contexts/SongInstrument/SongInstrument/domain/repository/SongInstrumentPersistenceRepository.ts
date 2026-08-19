import { SongInstrument } from '../SongInstrument.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { SongInstrumentId } from '../value-object/SongInstrumentId.js';
import { SongInstrumentMusicianId } from '../value-object/SongInstrumentMusicianId.js';

import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export interface SongInstrumentPersistenceRepository {
  search(id: SongInstrumentId): Promise<Nullable<SongInstrument>>;

  save(model: SongInstrument): Promise<void>;
  matching(criteria: Criteria): Promise<Array<SongInstrument>>;

  matchingCount(criteria: Criteria): Promise<number>;

  reassignBandMemberInstruments(
    bandId: string,
    previousMusicianId: SongInstrumentMusicianId,
    newMusicianId: SongInstrumentMusicianId
  ): Promise<number>;
}
