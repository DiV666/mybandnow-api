import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { SongCreatedDomainEvent } from './SongCreatedDomainEvent.js';
import { SongBandId } from './value-object/SongBandId.js';
import { SongId } from './value-object/SongId.js';
import { SongOriginalVideoClipDurationSeconds } from './value-object/SongOriginalVideoClipDurationSeconds.js';
import { SongOriginalVideoclipUrl } from './value-object/SongOriginalVideoclipUrl.js';
import { SongTitle } from './value-object/SongTitle.js';

export class Song extends AggregateRoot {
  constructor(
    readonly id: SongId,
    readonly bandId: SongBandId,
    readonly title: SongTitle,
    readonly originalVideoclipUrl: SongOriginalVideoclipUrl,
    readonly originalVideoClipDurationSeconds: Nullable<SongOriginalVideoClipDurationSeconds>
  ) {
    super();
  }

  static create(params: { id: string; title: string; bandId: string; originalVideoclipUrl: string }): Song {
    const model = Song.fromPrimitives({ ...params, originalVideoClipDurationSeconds: null });
    const primitives = model.toPrimitives();

    model.record(
      new SongCreatedDomainEvent({
        aggregateId: primitives.id,
        bandId: primitives.bandId,
        title: primitives.title,
        originalVideoclipUrl: primitives.originalVideoclipUrl
      })
    );

    return model;
  }

  static fromPrimitives(plainData: Primitives<Song>): Song {
    return new Song(
      new SongId(plainData.id),
      new SongBandId(plainData.bandId),
      new SongTitle(plainData.title),
      new SongOriginalVideoclipUrl(plainData.originalVideoclipUrl),
      plainData.originalVideoClipDurationSeconds === null
        ? null
        : new SongOriginalVideoClipDurationSeconds(plainData.originalVideoClipDurationSeconds)
    );
  }

  toPrimitives(): Primitives<Song> {
    return {
      id: this.id.value,
      bandId: this.bandId.value,
      title: this.title.value,
      originalVideoclipUrl: this.originalVideoclipUrl.value,
      originalVideoClipDurationSeconds: this.originalVideoClipDurationSeconds?.value ?? null
    };
  }
}
