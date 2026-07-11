import { Track } from '../../../../../../src/Contexts/Moat/Track/domain/Track.js';
import { TrackIdMother } from './TrackIdMother.js';
import { Repeater } from '../../../Shared/domain/value-object/Repeater.js';
import { TrackCreatedAtMother } from './TrackCreatedAtMother.js';
import { TrackSongIdMother } from './TrackSongIdMother.js';
import { TrackInstrumentNameMother } from './TrackInstrumentNameMother.js';
import { TrackStatusMother } from './TrackStatusMother.js';

export class TrackMother {
  private static defaults(): Partial<Track> {
    return {
      id: TrackIdMother.random(),
      status: TrackStatusMother.random(),
      instrumentName: TrackInstrumentNameMother.random(),
      songId: TrackSongIdMother.random(),
      createdAt: TrackCreatedAtMother.now()
    };
  }

  static create(...params: Partial<Track>[]): Track {
    const data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = Object.assign(
      {},
      TrackMother.defaults(),
      ...params
    );

    return Track.fromPrimitives({
      id: data.id.value,
      status: data.status.value,
      instrumentName: data.instrumentName.value,
      songId: data.songId.value,
      createdAt: data.createdAt.value.toISOString()
    });
  }

  static random(): Track {
    return TrackMother.create(TrackMother.defaults());
  }

  static createList(): Array<Track> {
    return Repeater.random(TrackMother.create);
  }
}
