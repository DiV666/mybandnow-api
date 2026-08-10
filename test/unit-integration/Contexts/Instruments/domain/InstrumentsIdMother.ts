import { InstrumentsId } from '@Contexts/Instruments/domain/value-object/InstrumentsId.js';
import { UuidMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

export class InstrumentsIdMother {
  static create(value: string): InstrumentsId {
    return new InstrumentsId(value);
  }

  static random(): InstrumentsId {
    return this.create(UuidMother.random());
  }
}
