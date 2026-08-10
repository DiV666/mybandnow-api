import { SongInstrumentVideoIdMother } from '../../domain/SongInstrumentVideoIdMother.js';
import { CreateSongInstrumentVideoCommand } from '@Contexts/SongInstrument/Video/application/create/CreateSongInstrumentVideoCommand.js';
import { SongInstrumentVideo } from '@Contexts/SongInstrument/Video/domain/SongInstrumentVideo.js';
import { SongInstrumentVideoSizeMother } from '../../domain/SongInstrumentVideoSizeMother.js';
import { SongInstrumentVideoDurationMother } from '../../domain/SongInstrumentVideoDurationMother.js';
import { SongInstrumentVideoUrlMother } from '../../domain/SongInstrumentVideoUrlMother.js';
import { SongInstrumentVideoSongInstrumentIdMother } from '../../domain/SongInstrumentVideoSongInstrumentIdMother.js';

export class CreateSongInstrumentVideoCommandMother {
  private static defaults() {
    return {
      id: SongInstrumentVideoIdMother.random().value,
      size: SongInstrumentVideoSizeMother.random().value,
      duration: SongInstrumentVideoDurationMother.random().value,
      url: SongInstrumentVideoUrlMother.random().value,
      songInstrumentId: SongInstrumentVideoSongInstrumentIdMother.random().value
    };
  }

  static create(
    params?: Partial<ReturnType<typeof CreateSongInstrumentVideoCommandMother.defaults>>
  ): CreateSongInstrumentVideoCommand {
    const commandData = { ...this.defaults(), ...params };
    return new CreateSongInstrumentVideoCommand(
      commandData.id,
      commandData.size,
      commandData.duration,
      commandData.url,
      commandData.songInstrumentId
    );
  }

  static fromModel(model: SongInstrumentVideo): CreateSongInstrumentVideoCommand {
    const p = model.toPrimitives();
    return this.create({
      id: p.id,
      size: p.size,
      duration: p.duration,
      url: p.url,
      songInstrumentId: p.songInstrumentId
    });
  }
}
