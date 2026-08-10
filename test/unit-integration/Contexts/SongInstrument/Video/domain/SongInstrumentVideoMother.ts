import { SongInstrumentVideo } from '@Contexts/SongInstrument/Video/domain/SongInstrumentVideo.js';
import { SongInstrumentVideoIdMother } from './SongInstrumentVideoIdMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';
import { SongInstrumentVideoCreatedAtMother } from './SongInstrumentVideoCreatedAtMother.js';
import { SongInstrumentVideoSongInstrumentIdMother } from './SongInstrumentVideoSongInstrumentIdMother.js';
import { SongInstrumentVideoUrlMother } from './SongInstrumentVideoUrlMother.js';
import { SongInstrumentVideoDurationMother } from './SongInstrumentVideoDurationMother.js';
import { SongInstrumentVideoSizeMother } from './SongInstrumentVideoSizeMother.js';
import { SongInstrumentVideoStartTimeMsMother } from './SongInstrumentVideoStartTimeMsMother.js';

export class SongInstrumentVideoMother {
  private static defaults(): Partial<SongInstrumentVideo> {
    return {
      id: SongInstrumentVideoIdMother.random(),
      size: SongInstrumentVideoSizeMother.random(),
      duration: SongInstrumentVideoDurationMother.random(),
      url: SongInstrumentVideoUrlMother.random(),
      songInstrumentId: SongInstrumentVideoSongInstrumentIdMother.random(),
      startTimeMs: SongInstrumentVideoStartTimeMsMother.create(0),
      createdAt: SongInstrumentVideoCreatedAtMother.now()
    };
  }

  static create(...params: Partial<SongInstrumentVideo>[]): SongInstrumentVideo {
    const data = Object.assign({}, SongInstrumentVideoMother.defaults(), ...params) as Required<SongInstrumentVideo>;

    return SongInstrumentVideo.fromPrimitives({
      id: data.id.value,
      size: data.size.value,
      duration: data.duration.value,
      url: data.url.value,
      songInstrumentId: data.songInstrumentId.value,
      startTimeMs: data.startTimeMs.value,
      createdAt: data.createdAt.value
    });
  }

  static random(): SongInstrumentVideo {
    return SongInstrumentVideoMother.create(SongInstrumentVideoMother.defaults());
  }

  static createList(): Array<SongInstrumentVideo> {
    return Repeater.random(SongInstrumentVideoMother.create);
  }
}
