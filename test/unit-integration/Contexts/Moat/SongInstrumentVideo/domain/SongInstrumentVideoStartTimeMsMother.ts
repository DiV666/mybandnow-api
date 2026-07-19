import { SongInstrumentVideoStartTimeMs } from '@Contexts/Moat/SongInstrumentVideo/domain/value-object/SongInstrumentVideoStartTimeMs.js';
import { NumberMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/NumberMother.js';

export class SongInstrumentVideoStartTimeMsMother {
  static create(value: number): SongInstrumentVideoStartTimeMs {
    return new SongInstrumentVideoStartTimeMs(value);
  }

  static random(max = 1000): SongInstrumentVideoStartTimeMs {
    return this.create(NumberMother.random({ max }));
  }
}
