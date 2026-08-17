import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentCreatedDomainEvent } from './SongInstrumentCreatedDomainEvent.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { SongInstrumentId } from './value-object/SongInstrumentId.js';
import { SongInstrumentCreatedAt } from './value-object/SongInstrumentCreatedAt.js';
import { SongInstrumentName } from './value-object/SongInstrumentName.js';
import { SongInstrumentSongId } from './value-object/SongInstrumentSongId.js';
import { SongInstrumentInstrumentId } from './value-object/SongInstrumentInstrumentId.js';
import { SongInstrumentMusicianId } from './value-object/SongInstrumentMusicianId.js';
import { SongInstrumentActiveUploadAttemptId } from './value-object/SongInstrumentActiveUploadAttemptId.js';

export class SongInstrument extends AggregateRoot {
  constructor(
    readonly id: SongInstrumentId,
    readonly musicianId: SongInstrumentMusicianId,
    readonly instrumentId: SongInstrumentInstrumentId,
    readonly songId: SongInstrumentSongId,
    readonly name: SongInstrumentName,
    readonly createdAt: SongInstrumentCreatedAt,
    public activeUploadAttemptId: SongInstrumentActiveUploadAttemptId | null
  ) {
    super();
  }

  static create(
    params: { id: string; musicianId: string; instrumentId: string; songId: string; name: string },
    clock: Clock
  ): SongInstrument {
    const createdAt = clock.now();

    const model = SongInstrument.fromPrimitives({
      ...params,
      createdAt: createdAt,
      activeUploadAttemptId: null
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

  activateUploadAttempt(uploadAttemptId: string): void {
    this.activeUploadAttemptId = new SongInstrumentActiveUploadAttemptId(uploadAttemptId);
  }

  hasActiveUploadAttempt(uploadAttemptId: string): boolean {
    return this.activeUploadAttemptId?.value === uploadAttemptId;
  }

  clearUploadAttempt(uploadAttemptId: string): void {
    if (!this.hasActiveUploadAttempt(uploadAttemptId)) {
      return;
    }

    this.activeUploadAttemptId = null;
  }

  reassignMusician(musicianId: string): SongInstrument {
    if (this.musicianId.value === musicianId) {
      return this;
    }

    return SongInstrument.fromPrimitives({
      ...this.toPrimitives(),
      musicianId
    });
  }

  editMetadata(name: string, instrumentId: string): SongInstrument {
    if (this.name.value === name && this.instrumentId.value === instrumentId) {
      return this;
    }

    return SongInstrument.fromPrimitives({
      ...this.toPrimitives(),
      name,
      instrumentId
    });
  }

  static fromPrimitives(
    plainData: Primitives<SongInstrument> & { activeUploadAttemptId?: string | null }
  ): SongInstrument {
    return new SongInstrument(
      new SongInstrumentId(plainData.id),
      new SongInstrumentMusicianId(plainData.musicianId),
      new SongInstrumentInstrumentId(plainData.instrumentId),
      new SongInstrumentSongId(plainData.songId),
      new SongInstrumentName(plainData.name),
      new SongInstrumentCreatedAt(plainData.createdAt),
      plainData.activeUploadAttemptId ? new SongInstrumentActiveUploadAttemptId(plainData.activeUploadAttemptId) : null
    );
  }

  toPrimitives(): Primitives<SongInstrument> & { activeUploadAttemptId: string | null } {
    return {
      id: this.id.value,
      musicianId: this.musicianId.value,
      instrumentId: this.instrumentId.value,
      songId: this.songId.value,
      name: this.name.value,
      createdAt: this.createdAt.value,
      activeUploadAttemptId: this.activeUploadAttemptId?.value ?? null
    };
  }
}
