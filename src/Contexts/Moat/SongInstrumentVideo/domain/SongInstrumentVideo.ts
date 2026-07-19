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
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export type SongInstrumentVideoPrimitives = {
  id: string;
  size: number;
  duration: number;
  url: string;
  songInstrumentId: string;
  startTimeMs: number;
  createdAt: Date;
};

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
    SongInstrumentVideo.ensureStartTimeMsIsWithinDuration(startTimeMs.value, duration.value);
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

  private static ensureStartTimeMsIsWithinDuration(startTimeMs: number, duration: number): void {
    if (startTimeMs > duration * 1000) {
      throw new InvalidArgumentException({
        message: `SongInstrumentVideo startTimeMs <${startTimeMs}> exceeds duration <${duration}> seconds`
      });
    }
  }
}
