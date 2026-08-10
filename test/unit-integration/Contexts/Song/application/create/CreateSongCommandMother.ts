import { CreateSongCommand } from '@Contexts/Song/application/create/CreateSongCommand.js';
import { Song } from '@Contexts/Song/domain/Song.js';
import { SongBandIdMother } from '../../domain/SongBandIdMother.js';
import { SongIdMother } from '../../domain/SongIdMother.js';
import { SongOriginalVideoclipUrlMother } from '../../domain/SongOriginalVideoclipUrlMother.js';
import { SongTitleMother } from '../../domain/SongTitleMother.js';

export class CreateSongCommandMother {
  private static defaults() {
    return {
      id: SongIdMother.random().value,
      title: SongTitleMother.random().value,
      bandId: SongBandIdMother.random().value,
      originalVideoclipUrl: SongOriginalVideoclipUrlMother.random().value
    };
  }

  static create(params?: Partial<ReturnType<typeof CreateSongCommandMother.defaults>>): CreateSongCommand {
    const commandData = { ...this.defaults(), ...params };

    return new CreateSongCommand(
      commandData.id,
      commandData.title,
      commandData.bandId,
      commandData.originalVideoclipUrl
    );
  }

  static fromModel(model: Song): CreateSongCommand {
    const primitives = model.toPrimitives();

    return this.create({
      id: primitives.id,
      title: primitives.title,
      bandId: primitives.bandId,
      originalVideoclipUrl: primitives.originalVideoclipUrl
    });
  }
}
