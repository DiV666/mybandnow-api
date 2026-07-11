import { VideoclipSongId } from '../../../../../../src/Contexts/Moat/Videoclip/domain/value-object/VideoclipSongId.js';
import { UuidMother } from '../../../Shared/domain/value-object/UuidMother.js';
export class VideoclipSongIdMother {
  static create(value: string): VideoclipSongId {
    return new VideoclipSongId(value);
  }

  static random(): VideoclipSongId {
    return this.create(UuidMother.random());
  }
}
