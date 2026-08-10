import { SongInstrumentIdMother } from '../../domain/SongInstrumentIdMother.js';
import { CreateSongInstrumentCommand } from '@Contexts/SongInstrument/SongInstrument/application/create/CreateSongInstrumentCommand.js';
import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentMusicianIdMother } from '../../domain/SongInstrumentMusicianIdMother.js';
import { SongInstrumentInstrumentIdMother } from '../../domain/SongInstrumentInstrumentIdMother.js';
import { SongInstrumentSongIdMother } from '../../domain/SongInstrumentSongIdMother.js';
import { SongInstrumentNameMother } from '../../domain/SongInstrumentNameMother.js';

export class CreateSongInstrumentCommandMother {
  private static defaults() {
    return {
      id: SongInstrumentIdMother.random().value,
      musicianId: SongInstrumentMusicianIdMother.random().value,
      instrumentId: SongInstrumentInstrumentIdMother.random().value,
      songId: SongInstrumentSongIdMother.random().value,
      name: SongInstrumentNameMother.random().value
    };
  }

  static create(
    params?: Partial<ReturnType<typeof CreateSongInstrumentCommandMother.defaults>>
  ): CreateSongInstrumentCommand {
    const commandData = { ...this.defaults(), ...params };
    return new CreateSongInstrumentCommand(
      commandData.id,
      commandData.name,
      commandData.songId,
      commandData.instrumentId,
      commandData.musicianId
    );
  }

  static fromModel(model: SongInstrument): CreateSongInstrumentCommand {
    const p = model.toPrimitives();
    return this.create({
      id: p.id,
      musicianId: p.musicianId,
      instrumentId: p.instrumentId,
      songId: p.songId,
      name: p.name
    });
  }
}
