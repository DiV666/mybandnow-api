import { Response } from '@Contexts/Shared/domain/Response.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { SongInstrumentVideo } from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export interface SongInstrumentWithVideoResponse extends Primitives<SongInstrument> {
  video: Primitives<SongInstrumentVideo> | null;
}

export class SongInstrumentFindByIdResponse implements Response, SongInstrumentWithVideoResponse {
  readonly id: string;
  readonly name: string;
  readonly instrumentType: string;
  readonly songId: string;
  readonly musicianId: string;
  readonly createdAt: Date;
  readonly video: Primitives<SongInstrumentVideo> | null;

  constructor(songInstrument: Primitives<SongInstrument>, video: Primitives<SongInstrumentVideo> | null) {
    this.id = songInstrument.id;
    this.name = songInstrument.name;
    this.instrumentType = songInstrument.instrumentType;
    this.songId = songInstrument.songId;
    this.musicianId = songInstrument.musicianId;
    this.createdAt = songInstrument.createdAt;
    this.video = video;
  }
}
