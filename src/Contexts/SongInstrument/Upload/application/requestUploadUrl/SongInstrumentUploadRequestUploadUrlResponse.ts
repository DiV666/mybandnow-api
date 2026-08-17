import { Response } from '@Contexts/Shared/domain/Response.js';

export class SongInstrumentUploadRequestUploadUrlResponse implements Response {
  constructor(
    readonly uploadId: string,
    readonly uploadUrl: string
  ) {}
}
