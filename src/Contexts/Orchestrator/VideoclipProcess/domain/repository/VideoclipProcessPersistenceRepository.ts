import { VideoclipProcess } from '../VideoclipProcess.js';
import { VideoclipProcessId } from '../value-object/VideoclipProcessId.js';
import { VideoclipProcessSongId } from '../value-object/VideoclipProcessSongId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export interface VideoclipProcessPersistenceRepository {
  save(videoclipProcess: VideoclipProcess): Promise<void>;
  search(id: VideoclipProcessId): Promise<Nullable<VideoclipProcess>>;
  searchActiveBySongId(songId: VideoclipProcessSongId): Promise<Nullable<VideoclipProcess>>;
}
