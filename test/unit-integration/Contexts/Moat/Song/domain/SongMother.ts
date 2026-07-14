import { Song } from '@Contexts/Moat/Song/domain/Song.js';
import { SongBandIdMother } from './SongBandIdMother.js';
import { SongIdMother } from './SongIdMother.js';
import { SongOriginalVideoclipUrlMother } from './SongOriginalVideoclipUrlMother.js';
import { SongTitleMother } from './SongTitleMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';

export class SongMother {
  private static defaults(): Partial<Song> {
    return {
      id: SongIdMother.random(),
      bandId: SongBandIdMother.random(),
      title: SongTitleMother.random(),
      originalVideoclipUrl: SongOriginalVideoclipUrlMother.random()
    };
  }

  static create(...params: Partial<Song>[]): Song {
    const data = Object.assign({}, SongMother.defaults(), ...params) as Required<Song>;

    return Song.fromPrimitives({
      id: data.id.value,
      bandId: data.bandId.value,
      title: data.title.value,
      originalVideoclipUrl: data.originalVideoclipUrl.value
    });
  }

  static random(): Song {
    return SongMother.create(SongMother.defaults());
  }

  static createList(): Array<Song> {
    return Repeater.random(SongMother.create);
  }
}
