import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { MusicianId } from './value-object/MusicianId.js';
import { MusicianUserId } from './value-object/MusicianUserId.js';
import { MusicianName } from './value-object/MusicianName.js';
import { MusicianUsername } from './value-object/MusicianUsername.js';

export class Musician extends AggregateRoot {
  constructor(
    readonly id: MusicianId,
    readonly username: MusicianUsername,
    readonly name: MusicianName,
    readonly userId: MusicianUserId
  ) {
    super();
  }

  static fromPrimitives(plainData: Primitives<Musician>): Musician {
    return new Musician(
      new MusicianId(plainData.id),
      new MusicianUsername(plainData.username),
      new MusicianName(plainData.name),
      new MusicianUserId(plainData.userId)
    );
  }

  toPrimitives(): Primitives<Musician> {
    return {
      id: this.id.value,
      username: this.username.value,
      name: this.name.value,
      userId: this.userId.value
    };
  }
}
