import { MusicianIdMother } from '../../domain/MusicianIdMother.js';
import { CreateMusicianCommand } from '@Contexts/Moat/Musician/application/create/CreateMusicianCommand.js';
import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';
import { MusicianUsernameMother } from '../../domain/MusicianUsernameMother.js';
import { MusicianNameMother } from '../../domain/MusicianNameMother.js';
import { MusicianUserIdMother } from '../../domain/MusicianUserIdMother.js';

export class CreateMusicianCommandMother {
  private static defaults() {
    return {
      id: MusicianIdMother.random().value,
      username: MusicianUsernameMother.random().value,
      name: MusicianNameMother.random().value,
      userId: MusicianUserIdMother.random().value
    };
  }

  static create(params?: Partial<ReturnType<typeof CreateMusicianCommandMother.defaults>>): CreateMusicianCommand {
    const commandData = { ...this.defaults(), ...params };
    return new CreateMusicianCommand(commandData.id, commandData.username, commandData.name, commandData.userId);
  }

  static fromModel(model: Musician): CreateMusicianCommand {
    const p = model.toPrimitives();
    return this.create({ id: p.id, username: p.username, name: p.name, userId: p.userId });
  }
}
