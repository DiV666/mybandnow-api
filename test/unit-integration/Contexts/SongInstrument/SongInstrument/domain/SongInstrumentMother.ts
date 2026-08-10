import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentIdMother } from './SongInstrumentIdMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';
import { SongInstrumentCreatedAtMother } from './SongInstrumentCreatedAtMother.js';
import { SongInstrumentNameMother } from './SongInstrumentNameMother.js';
import { SongInstrumentSongIdMother } from './SongInstrumentSongIdMother.js';
import { SongInstrumentInstrumentIdMother } from './SongInstrumentInstrumentIdMother.js';
import { SongInstrumentMusicianIdMother } from './SongInstrumentMusicianIdMother.js';

export class SongInstrumentMother {
  private static defaults(): Partial<SongInstrument> {
    return {
      id: SongInstrumentIdMother.random(),
      musicianId: SongInstrumentMusicianIdMother.random(),
      instrumentId: SongInstrumentInstrumentIdMother.random(),
      songId: SongInstrumentSongIdMother.random(),
      name: SongInstrumentNameMother.random(),
      createdAt: SongInstrumentCreatedAtMother.now(),
      activeUploadAttemptId: null
    };
  }

  static create(...params: Partial<SongInstrument>[]): SongInstrument {
    const data = Object.assign({}, SongInstrumentMother.defaults(), ...params) as Required<SongInstrument>;

    return SongInstrument.fromPrimitives({
      id: data.id.value,
      musicianId: data.musicianId.value,
      instrumentId: data.instrumentId.value,
      songId: data.songId.value,
      name: data.name.value,
      createdAt: data.createdAt.value,
      activeUploadAttemptId: data.activeUploadAttemptId?.value ?? null
    });
  }

  static random(): SongInstrument {
    return SongInstrumentMother.create(SongInstrumentMother.defaults());
  }

  static createList(): Array<SongInstrument> {
    return Repeater.random(SongInstrumentMother.create);
  }
}
