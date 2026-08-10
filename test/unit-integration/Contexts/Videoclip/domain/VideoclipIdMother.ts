import { VideoclipId } from '../../../../../src/Contexts/Videoclip/domain/value-object/VideoclipId.js';
import { UuidMother } from '../../Shared/domain/value-object/UuidMother.js';

export class VideoclipIdMother {
  static create(value: string): VideoclipId {
    return new VideoclipId(value);
  }

  static random(): VideoclipId {
    return this.create(UuidMother.random());
  }
}
