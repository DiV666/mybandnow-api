import { Videoclip } from '../../../../../src/Contexts/Videoclip/domain/Videoclip.js';
import { VideoclipIdMother } from './VideoclipIdMother.js';
import { Repeater } from '../../Shared/domain/value-object/Repeater.js';
import { VideoclipCreatedAtMother } from './VideoclipCreatedAtMother.js';
import { VideoclipSongIdMother } from './VideoclipSongIdMother.js';
import { VideoclipIsPublicMother } from './VideoclipIsPublicMother.js';
import { VideoclipUrlMother } from './VideoclipUrlMother.js';
import { VideoclipDurationMother } from './VideoclipDurationMother.js';
import { VideoclipSizeMother } from './VideoclipSizeMother.js';

export class VideoclipMother {
  private static defaults(): Partial<Videoclip> {
    return {
      id: VideoclipIdMother.random(),
      size: VideoclipSizeMother.random(),
      duration: VideoclipDurationMother.random(),
      url: VideoclipUrlMother.random(),
      isPublic: VideoclipIsPublicMother.random(),
      songId: VideoclipSongIdMother.random(),
      createdAt: VideoclipCreatedAtMother.now()
    };
  }

  static create(...params: Partial<Videoclip>[]): Videoclip {
    const data = Object.assign({}, VideoclipMother.defaults(), ...params) as Required<
      ReturnType<typeof VideoclipMother.defaults>
    >;

    return Videoclip.fromPrimitives({
      id: data.id.value,
      size: data.size.value,
      duration: data.duration.value,
      url: data.url.value,
      isPublic: data.isPublic.value,
      songId: data.songId.value,
      createdAt: data.createdAt.value.toISOString()
    });
  }

  static random(): Videoclip {
    return VideoclipMother.create(VideoclipMother.defaults());
  }

  static createList(): Array<Videoclip> {
    return Repeater.random(VideoclipMother.create);
  }
}
