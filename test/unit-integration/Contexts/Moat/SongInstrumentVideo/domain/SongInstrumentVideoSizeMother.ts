import { SongInstrumentVideoSize } from '../../../../../../src/Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoSize.js';
import { NumberMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/NumberMother.js';
export class SongInstrumentVideoSizeMother {
  static create(value: number): SongInstrumentVideoSize {
    return new SongInstrumentVideoSize(value);
  }

  static random(): SongInstrumentVideoSize {
    return this.create(NumberMother.random({ max: 100000 }));
  }
}
