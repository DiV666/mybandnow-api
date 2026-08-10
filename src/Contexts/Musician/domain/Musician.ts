import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { MusicianCreatedDomainEvent } from './MusicianCreatedDomainEvent.js';
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

  static create(params: { id: string; username: string; name: string; userId: string }, clock: Clock): Musician {
    const createdAt = clock.now();

    const model = Musician.fromPrimitives(params);

    const { id, ...primitives } = model.toPrimitives();
    model.record(
      new MusicianCreatedDomainEvent({
        aggregateId: id,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
        ...primitives
      })
    );

    return model;
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
