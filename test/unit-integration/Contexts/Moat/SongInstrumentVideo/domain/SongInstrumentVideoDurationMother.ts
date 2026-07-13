import { SongInstrumentVideoDuration } from '../../../../../../src/Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoDuration.js';
import { NumberMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/NumberMother.js';
export class SongInstrumentVideoDurationMother {
  static create(value: number): SongInstrumentVideoDuration {
    return new SongInstrumentVideoDuration(value);
  }

  static random(): SongInstrumentVideoDuration {
    return this.create(NumberMother.random({ max: 10000 }));
  }
}
