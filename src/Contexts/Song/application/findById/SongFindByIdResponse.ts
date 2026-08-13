import { Response } from '@Contexts/Shared/domain/Response.js';
import { Song } from '../../domain/Song.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export type PublicSong = Pick<Primitives<Song>, 'id' | 'bandId' | 'title' | 'originalVideoclipUrl'>;

export class SongFindByIdResponse implements Response {
  constructor(readonly song: Nullable<PublicSong>) {}
}
