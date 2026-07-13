import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentVideoCreatedDomainEvent } from './SongInstrumentVideoCreatedDomainEvent.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { SongInstrumentVideoId } from './value-object/SongInstrumentVideoId.js';
import { SongInstrumentVideoCreatedAt } from './value-object/SongInstrumentVideoCreatedAt.js';
import { SongInstrumentVideoSongInstrumentId } from './value-object/SongInstrumentVideoSongInstrumentId.js';
import { SongInstrumentVideoUrl } from './value-object/SongInstrumentVideoUrl.js';
import { SongInstrumentVideoDuration } from './value-object/SongInstrumentVideoDuration.js';
import { SongInstrumentVideoSize } from './value-object/SongInstrumentVideoSize.js';

export class SongInstrumentVideo extends AggregateRoot {
  constructor(
    readonly id: SongInstrumentVideoId,
    readonly size: SongInstrumentVideoSize,
    readonly duration: SongInstrumentVideoDuration,
    readonly url: SongInstrumentVideoUrl,
    readonly songInstrumentId: SongInstrumentVideoSongInstrumentId,
    readonly createdAt: SongInstrumentVideoCreatedAt
  ) {
    super();
  }

  static create(
    params: { id: string; size: number; duration: number; url: string; songInstrumentId: string },
    clock: Clock
  ): SongInstrumentVideo {
    const createdAt = clock.now();

    const model = SongInstrumentVideo.fromPrimitives({
      ...params,
      createdAt: createdAt
    });

    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    model.record(
      new SongInstrumentVideoCreatedDomainEvent({
        aggregateId: id,
        createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
        ...primitives
      })
    );

    return model;
  }

  static fromPrimitives(plainData: Primitives<SongInstrumentVideo>): SongInstrumentVideo {
    return new SongInstrumentVideo(
      new SongInstrumentVideoId(plainData.id),
      new SongInstrumentVideoSize(plainData.size),
      new SongInstrumentVideoDuration(plainData.duration),
      new SongInstrumentVideoUrl(plainData.url),
      new SongInstrumentVideoSongInstrumentId(plainData.songInstrumentId),
      new SongInstrumentVideoCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): Primitives<SongInstrumentVideo> {
    return {
      id: this.id.value,
      size: this.size.value,
      duration: this.duration.value,
      url: this.url.value,
      songInstrumentId: this.songInstrumentId.value,
      createdAt: this.createdAt.value
    };
  }
}
