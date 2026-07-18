import { InstrumentsName } from '../../../../../../src/Contexts/Moat/Instruments/domain/value-object/InstrumentsName.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class InstrumentsNameMother {
  static create(value: string): InstrumentsName {
    return new InstrumentsName(value);
  }

  static random(): InstrumentsName {
    return this.create(StringMother.random());
  }
}
