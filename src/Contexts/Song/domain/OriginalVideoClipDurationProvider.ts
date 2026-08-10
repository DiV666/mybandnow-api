import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export interface OriginalVideoClipDurationProvider {
  getDurationInSeconds(url: string): Promise<Nullable<number>>;
}
