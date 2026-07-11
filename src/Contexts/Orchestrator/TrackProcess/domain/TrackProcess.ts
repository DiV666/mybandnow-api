import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { TrackProcessId } from './value-object/TrackProcessId.js';
import { GcsPath } from './value-object/GcsPath.js';
import { FileSize } from './value-object/FileSize.js';
import { Codec } from './value-object/Codec.js';
import { FfprobeLog } from './value-object/FfprobeLog.js';
import { TrackProcessUpdatedAt } from './value-object/TrackProcessUpdatedAt.js';

export class TrackProcess extends AggregateRoot {
  readonly id: TrackProcessId;
  readonly gcsPath: GcsPath;
  readonly fileSize: FileSize;
  readonly codec: Codec;
  readonly ffprobeLog: FfprobeLog;
  readonly updatedAt: TrackProcessUpdatedAt;

  constructor(
    id: TrackProcessId,
    gcsPath: GcsPath,
    fileSize: FileSize,
    codec: Codec,
    ffprobeLog?: FfprobeLog,
    updatedAt?: TrackProcessUpdatedAt
  ) {
    super();
    this.id = id;
    this.gcsPath = gcsPath;
    this.fileSize = fileSize;
    this.codec = codec;
    this.ffprobeLog = ffprobeLog || new FfprobeLog({});
    this.updatedAt = updatedAt || new TrackProcessUpdatedAt(new Date());
  }

  static fromPrimitives(plainData: {
    id: string;
    gcsPath: string;
    fileSize: number;
    codec: string;
    ffprobeLog: Record<string, unknown> | null;
    updatedAt: Date;
  }): TrackProcess {
    return new TrackProcess(
      new TrackProcessId(plainData.id),
      new GcsPath(plainData.gcsPath),
      new FileSize(plainData.fileSize),
      new Codec(plainData.codec),
      new FfprobeLog(plainData.ffprobeLog),
      new TrackProcessUpdatedAt(plainData.updatedAt)
    );
  }

  toPrimitives(): {
    id: string;
    gcsPath: string;
    fileSize: number;
    codec: string;
    ffprobeLog: Record<string, unknown> | null;
    updatedAt: Date;
  } {
    return {
      id: this.id.value,
      gcsPath: this.gcsPath.value,
      fileSize: this.fileSize.value,
      codec: this.codec.value,
      ffprobeLog: this.ffprobeLog.value as Record<string, unknown>,
      updatedAt: this.updatedAt.value
    };
  }
}
