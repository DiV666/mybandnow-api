import { SongInstrumentUpload } from '@Contexts/SongInstrument/Upload/domain/SongInstrumentUpload.js';
import { SongInstrumentUploadStatusValues } from '@Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';

const DEFAULT_FAILED_UPLOAD_PUBLIC_ERROR_MESSAGE = 'The uploaded video could not be processed. Please try again.';

export interface FailedPublicSongInstrumentUploadResponse {
  id: string;
  status: typeof SongInstrumentUploadStatusValues.FAILED;
  errorMessage: string;
}

export interface NonFailedPublicSongInstrumentUploadResponse {
  id: string;
  status:
    | typeof SongInstrumentUploadStatusValues.PENDING
    | typeof SongInstrumentUploadStatusValues.READY
    | typeof SongInstrumentUploadStatusValues.PROCESSING
    | typeof SongInstrumentUploadStatusValues.COMPLETED
    | typeof SongInstrumentUploadStatusValues.CANCELLED;
}

export type PublicSongInstrumentUploadResponse =
  | FailedPublicSongInstrumentUploadResponse
  | NonFailedPublicSongInstrumentUploadResponse;

export function toPublicSongInstrumentUploadResponse(
  upload: SongInstrumentUpload | null
): PublicSongInstrumentUploadResponse | null {
  if (!upload) {
    return null;
  }

  if (upload.status.value === SongInstrumentUploadStatusValues.FAILED) {
    return {
      id: upload.id.value,
      status: SongInstrumentUploadStatusValues.FAILED,
      errorMessage: upload.errorMessage?.value ?? DEFAULT_FAILED_UPLOAD_PUBLIC_ERROR_MESSAGE
    };
  }

  return {
    id: upload.id.value,
    status: upload.status.value as NonFailedPublicSongInstrumentUploadResponse['status']
  };
}
