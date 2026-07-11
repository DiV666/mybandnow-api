import { VideoclipUrl } from '../../../../../../src/Contexts/Moat/Videoclip/domain/value-object/VideoclipUrl.js';
import { StringMother } from '../../../Shared/domain/value-object/StringMother.js';
export class VideoclipUrlMother {
  static create(value: string): VideoclipUrl {
    return new VideoclipUrl(value);
  }

  static random(): VideoclipUrl {
    return this.create(StringMother.random());
  }
}
