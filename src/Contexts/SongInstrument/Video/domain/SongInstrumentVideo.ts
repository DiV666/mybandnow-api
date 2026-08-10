import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { SongInstrumentVideoCreatedDomainEvent } from './SongInstrumentVideoCreatedDomainEvent.js';
import { SongInstrumentVideoId } from './value-object/SongInstrumentVideoId.js';
import { SongInstrumentVideoCreatedAt } from './value-object/SongInstrumentVideoCreatedAt.js';
import { SongInstrumentVideoSongInstrumentId } from './value-object/SongInstrumentVideoSongInstrumentId.js';
import { SongInstrumentVideoUrl } from './value-object/SongInstrumentVideoUrl.js';
import { SongInstrumentVideoDuration } from './value-object/SongInstrumentVideoDuration.js';
import { SongInstrumentVideoSize } from './value-object/SongInstrumentVideoSize.js';
import { SongInstrumentVideoStartTimeMs } from './value-object/SongInstrumentVideoStartTimeMs.js';
import { SongInstrumentVideoUpdatedDomainEvent } from './SongInstrumentVideoUpdatedDomainEvent.js';
import { SongInstrumentVideoReplacedDomainEvent } from './SongInstrumentVideoReplacedDomainEvent.js';

export type SongInstrumentVideoPrimitives = {
  id: string;
  size: number;
  duration: number;
  url: string;
  songInstrumentId: string;
  startTimeMs: number;
  createdAt: Date;
};

// `startTimeMs` models the clip position inside the current global composition timeline.
// For the current product behavior it is validated only as a non-negative offset, even
// when it exceeds the clip's own duration.
export class SongInstrumentVideo extends AggregateRoot {
  constructor(
    readonly id: SongInstrumentVideoId,
    readonly size: SongInstrumentVideoSize,
    readonly duration: SongInstrumentVideoDuration,
    readonly url: SongInstrumentVideoUrl,
    readonly songInstrumentId: SongInstrumentVideoSongInstrumentId,
    readonly startTimeMs: SongInstrumentVideoStartTimeMs,
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
      startTimeMs: 0,
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

  updateStartTimeMs(startTimeMs: number): SongInstrumentVideo {
    if (this.startTimeMs.value === startTimeMs) {
      return this;
    }

    const model = SongInstrumentVideo.fromPrimitives({
      ...this.toPrimitives(),
      startTimeMs
    });

    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    model.record(
      new SongInstrumentVideoUpdatedDomainEvent({
        aggregateId: id,
        createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
        ...primitives
      })
    );

    return model;
  }

  replaceUpload(params: { size: number; duration: number; url: string }): SongInstrumentVideo {
    const model = SongInstrumentVideo.fromPrimitives({
      id: this.id.value,
      size: params.size,
      duration: params.duration,
      url: params.url,
      songInstrumentId: this.songInstrumentId.value,
      startTimeMs: 0,
      createdAt: this.createdAt.value
    });

    model.record(
      new SongInstrumentVideoReplacedDomainEvent({
        aggregateId: this.id.value,
        songInstrumentId: this.songInstrumentId.value,
        oldUrl: this.url.value,
        newUrl: model.url.value
      })
    );

    return model;
  }

  static fromPrimitives(plainData: SongInstrumentVideoPrimitives): SongInstrumentVideo {
    return new SongInstrumentVideo(
      new SongInstrumentVideoId(plainData.id),
      new SongInstrumentVideoSize(plainData.size),
      new SongInstrumentVideoDuration(plainData.duration),
      new SongInstrumentVideoUrl(plainData.url),
      new SongInstrumentVideoSongInstrumentId(plainData.songInstrumentId),
      new SongInstrumentVideoStartTimeMs(plainData.startTimeMs ?? 0),
      new SongInstrumentVideoCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): SongInstrumentVideoPrimitives {
    return {
      id: this.id.value,
      size: this.size.value,
      duration: this.duration.value,
      url: this.url.value,
      songInstrumentId: this.songInstrumentId.value,
      startTimeMs: this.startTimeMs.value,
      createdAt: this.createdAt.value
    };
  }
}
