import { Response } from '@Contexts/Shared/domain/Response.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { SongInstrumentVideo } from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { PublicSongInstrumentUploadResponse } from '../PublicSongInstrumentUploadResponse.js';

export interface SongInstrumentWithVideoResponse {
  id: string;
  name: string;
  instrumentType: string;
  songId: string;
  musicianId: string;
  createdAt: Date;
  video: Primitives<SongInstrumentVideo> | null;
  upload: PublicSongInstrumentUploadResponse | null;
}

export class SongInstrumentFindByIdResponse implements Response, SongInstrumentWithVideoResponse {
  readonly id: string;
  readonly name: string;
  readonly instrumentType: string;
  readonly songId: string;
  readonly musicianId: string;
  readonly createdAt: Date;
  readonly video: Primitives<SongInstrumentVideo> | null;
  readonly upload: PublicSongInstrumentUploadResponse | null;

  constructor(
    songInstrument: Primitives<SongInstrument>,
    video: Primitives<SongInstrumentVideo> | null,
    upload: PublicSongInstrumentUploadResponse | null = null
  ) {
    this.id = songInstrument.id;
    this.name = songInstrument.name;
    this.instrumentType = songInstrument.instrumentType;
    this.songId = songInstrument.songId;
    this.musicianId = songInstrument.musicianId;
    this.createdAt = songInstrument.createdAt;
    this.video = video;
    this.upload = upload;
  }
}
