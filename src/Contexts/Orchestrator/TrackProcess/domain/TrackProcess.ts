import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { TrackProcessId } from './value-object/TrackProcessId.js';
import { TrackProcessStatus } from './value-object/TrackProcessStatus.js';
import { GcsPath } from './value-object/GcsPath.js';
import { FileSize } from './value-object/FileSize.js';
import { Codec } from './value-object/Codec.js';
import { FfprobeLog } from './value-object/FfprobeLog.js';
import { TrackProcessUpdatedAt } from './value-object/TrackProcessUpdatedAt.js';
import { TrackProcessCompletedDomainEvent } from './TrackProcessCompletedDomainEvent.js';
import { TrackProcessFailedDomainEvent } from './TrackProcessFailedDomainEvent.js';

export class TrackProcess extends AggregateRoot {
  readonly id: TrackProcessId;
  readonly status: TrackProcessStatus;
  readonly gcsPath: GcsPath | null;
  readonly fileSize: FileSize | null;
  readonly codec: Codec | null;
  readonly ffprobeLog: FfprobeLog;
  readonly updatedAt: TrackProcessUpdatedAt;

  constructor(
    id: TrackProcessId,
    status: TrackProcessStatus,
    gcsPath: GcsPath | null,
    fileSize: FileSize | null,
    codec: Codec | null,
    ffprobeLog?: FfprobeLog,
    updatedAt?: TrackProcessUpdatedAt
  ) {
    super();
    this.id = id;
    this.status = status;
    this.gcsPath = gcsPath;
    this.fileSize = fileSize;
    this.codec = codec;
    this.ffprobeLog = ffprobeLog || new FfprobeLog({});
    this.updatedAt = updatedAt || new TrackProcessUpdatedAt(new Date());
  }

  static complete(
    id: TrackProcessId,
    gcsPath: GcsPath,
    fileSize: FileSize,
    codec: Codec,
    ffprobeLog: FfprobeLog
  ): TrackProcess {
    const process = new TrackProcess(id, TrackProcessStatus.completed(), gcsPath, fileSize, codec, ffprobeLog);
    process.record(new TrackProcessCompletedDomainEvent({ aggregateId: id.value }));
    return process;
  }

  static fail(id: TrackProcessId, errorMsg: string): TrackProcess {
    const process = new TrackProcess(
      id,
      TrackProcessStatus.failed(),
      null,
      null,
      null,
      new FfprobeLog({ error: errorMsg })
    );
    process.record(new TrackProcessFailedDomainEvent({ aggregateId: id.value }));
    return process;
  }

  static fromPrimitives(plainData: {
    id: string;
    status: string;
    gcsPath: string | null;
    fileSize: number | null;
    codec: string | null;
    ffprobeLog: Record<string, unknown> | null;
    updatedAt: Date;
  }): TrackProcess {
    return new TrackProcess(
      new TrackProcessId(plainData.id),
      new TrackProcessStatus(plainData.status),
      plainData.gcsPath ? new GcsPath(plainData.gcsPath) : null,
      plainData.fileSize ? new FileSize(plainData.fileSize) : null,
      plainData.codec ? new Codec(plainData.codec) : null,
      new FfprobeLog(plainData.ffprobeLog),
      new TrackProcessUpdatedAt(plainData.updatedAt)
    );
  }

  toPrimitives(): {
    id: string;
    status: string;
    gcsPath: string | null;
    fileSize: number | null;
    codec: string | null;
    ffprobeLog: Record<string, unknown> | null;
    updatedAt: Date;
  } {
    return {
      id: this.id.value,
      status: this.status.value,
      gcsPath: this.gcsPath ? this.gcsPath.value : null,
      fileSize: this.fileSize ? this.fileSize.value : null,
      codec: this.codec ? this.codec.value : null,
      ffprobeLog: this.ffprobeLog.value as Record<string, unknown>,
      updatedAt: this.updatedAt.value
    };
  }
}
