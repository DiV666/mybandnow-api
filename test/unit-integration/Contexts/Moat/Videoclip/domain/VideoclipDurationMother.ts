import { VideoclipDuration } from '../../../../../../src/Contexts/Moat/Videoclip/domain/value-object/VideoclipDuration.js';
import { NumberMother } from '../../../Shared/domain/value-object/NumberMother.js';
export class VideoclipDurationMother {
  static create(value: number): VideoclipDuration {
    return new VideoclipDuration(value);
  }

  static random(): VideoclipDuration {
    return this.create(NumberMother.random({ max: 10000 }));
  }
}
