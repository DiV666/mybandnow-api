import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { VideoclipCreatedDomainEvent } from './domain-event/VideoclipCreatedDomainEvent.js';
import { VideoclipId } from './value-object/VideoclipId.js';
import { VideoclipCreatedAt } from './value-object/VideoclipCreatedAt.js';
import { VideoclipSongId } from './value-object/VideoclipSongId.js';
import { VideoclipIsPublic } from './value-object/VideoclipIsPublic.js';
import { VideoclipUrl } from './value-object/VideoclipUrl.js';
import { VideoclipDuration } from './value-object/VideoclipDuration.js';
import { VideoclipSize } from './value-object/VideoclipSize.js';

export type VideoclipPrimitives = {
  id: string;
  size: number;
  duration: number;
  url: string;
  isPublic: boolean;
  songId: string;
  createdAt: string;
};

export class Videoclip extends AggregateRoot {
  constructor(
    readonly id: VideoclipId,
    readonly size: VideoclipSize,
    readonly duration: VideoclipDuration,
    readonly url: VideoclipUrl,
    readonly isPublic: VideoclipIsPublic,
    readonly songId: VideoclipSongId,
    readonly createdAt: VideoclipCreatedAt
  ) {
    super();
  }

  static create(params: {
    id: string;
    size: number;
    duration: number;
    url: string;
    isPublic: boolean;
    songId: string;
  }): Videoclip {
    const createdAt = new Date();

    const model = Videoclip.fromPrimitives({
      ...params,
      createdAt: createdAt.toISOString()
    });

    const { id, ...primitives } = model.toPrimitives();
    model.record(
      new VideoclipCreatedDomainEvent({
        aggregateId: id,
        ...primitives
      })
    );

    return model;
  }

  static fromPrimitives(plainData: VideoclipPrimitives): Videoclip {
    return new Videoclip(
      new VideoclipId(plainData.id),
      new VideoclipSize(plainData.size),
      new VideoclipDuration(plainData.duration),
      new VideoclipUrl(plainData.url),
      new VideoclipIsPublic(plainData.isPublic),
      new VideoclipSongId(plainData.songId),
      new VideoclipCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): VideoclipPrimitives & Record<string, unknown> {
    return {
      id: this.id.value,
      size: this.size.value,
      duration: this.duration.value,
      url: this.url.value,
      isPublic: this.isPublic.value,
      songId: this.songId.value,
      createdAt: this.createdAt.value.toISOString()
    };
  }
}
