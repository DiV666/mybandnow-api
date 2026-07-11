import { TrackInstrumentName } from '../../../../../../src/Contexts/Moat/Track/domain/value-object/TrackInstrumentName.js';
import { StringMother } from '../../../Shared/domain/value-object/StringMother.js';
export class TrackInstrumentNameMother {
  static create(value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): TrackInstrumentName {
    return new TrackInstrumentName(value);
  }

  static random(): TrackInstrumentName {
    return this.create(StringMother.random());
  }
}
