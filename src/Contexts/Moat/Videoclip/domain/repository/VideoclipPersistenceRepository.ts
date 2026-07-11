import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Videoclip } from '../Videoclip.js';
import { VideoclipId } from '../value-object/VideoclipId.js';

export interface VideoclipPersistenceRepository {
  save(model: Videoclip): Promise<void>;
  search(id: VideoclipId): Promise<Nullable<Videoclip>>;
}
