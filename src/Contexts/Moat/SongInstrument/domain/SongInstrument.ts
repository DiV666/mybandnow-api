import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentCreatedDomainEvent } from './SongInstrumentCreatedDomainEvent.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { SongInstrumentId } from './value-object/SongInstrumentId.js';
import { SongInstrumentCreatedAt } from './value-object/SongInstrumentCreatedAt.js';
import { SongInstrumentName } from './value-object/SongInstrumentName.js';
import { SongInstrumentSongId } from './value-object/SongInstrumentSongId.js';
import { SongInstrumentInstrumentType } from './value-object/SongInstrumentInstrumentType.js';
import { SongInstrumentMusicianId } from './value-object/SongInstrumentMusicianId.js';

export class SongInstrument extends AggregateRoot {
  constructor(
    readonly id: SongInstrumentId,
    readonly musicianId: SongInstrumentMusicianId,
    readonly instrumentType: SongInstrumentInstrumentType,
    readonly songId: SongInstrumentSongId,
    readonly name: SongInstrumentName,
    readonly createdAt: SongInstrumentCreatedAt
  ) {
    super();
  }

  static create(
    params: { id: string; musicianId: string; instrumentType: string; songId: string; name: string },
    clock: Clock
  ): SongInstrument {
    const createdAt = clock.now();

    const model = SongInstrument.fromPrimitives({
      ...params,
      createdAt: createdAt
    });

    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    model.record(
      new SongInstrumentCreatedDomainEvent({
        aggregateId: id,
        createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
        ...primitives
      })
    );

    return model;
  }

  static fromPrimitives(plainData: Primitives<SongInstrument>): SongInstrument {
    return new SongInstrument(
      new SongInstrumentId(plainData.id),
      new SongInstrumentMusicianId(plainData.musicianId),
      new SongInstrumentInstrumentType(plainData.instrumentType),
      new SongInstrumentSongId(plainData.songId),
      new SongInstrumentName(plainData.name),
      new SongInstrumentCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): Primitives<SongInstrument> {
    return {
      id: this.id.value,
      musicianId: this.musicianId.value,
      instrumentType: this.instrumentType.value,
      songId: this.songId.value,
      name: this.name.value,
      createdAt: this.createdAt.value
    };
  }
}
