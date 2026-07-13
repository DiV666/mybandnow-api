import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { SongInstrumentProcessId } from './value-object/SongInstrumentProcessId.js';
import { SongInstrumentProcessStatus } from './value-object/SongInstrumentProcessStatus.js';
import { GcsPath } from './value-object/GcsPath.js';
import { FileSize } from './value-object/FileSize.js';
import { Codec } from './value-object/Codec.js';
import { FfprobeLog } from './value-object/FfprobeLog.js';
import { SongInstrumentProcessUpdatedAt } from './value-object/SongInstrumentProcessUpdatedAt.js';
import { SongInstrumentProcessCompletedDomainEvent } from './SongInstrumentProcessCompletedDomainEvent.js';
import { SongInstrumentProcessFailedDomainEvent } from './SongInstrumentProcessFailedDomainEvent.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export class SongInstrumentProcess extends AggregateRoot {
  readonly id: SongInstrumentProcessId;
  readonly status: SongInstrumentProcessStatus;
  readonly gcsPath: GcsPath | null;
  readonly fileSize: FileSize | null;
  readonly codec: Codec | null;
  readonly ffprobeLog: FfprobeLog;
  readonly updatedAt: SongInstrumentProcessUpdatedAt;

  constructor(
    id: SongInstrumentProcessId,
    status: SongInstrumentProcessStatus,
    gcsPath: GcsPath | null,
    fileSize: FileSize | null,
    codec: Codec | null,
    ffprobeLog?: FfprobeLog,
    updatedAt?: SongInstrumentProcessUpdatedAt
  ) {
    super();
    this.id = id;
    this.status = status;
    this.gcsPath = gcsPath;
    this.fileSize = fileSize;
    this.codec = codec;
    this.ffprobeLog = ffprobeLog || new FfprobeLog({});
    this.updatedAt = updatedAt || new SongInstrumentProcessUpdatedAt(new Date());
  }

  static complete(
    id: SongInstrumentProcessId,
    gcsPath: GcsPath,
    fileSize: FileSize,
    codec: Codec,
    ffprobeLog: FfprobeLog
  ): SongInstrumentProcess {
    const process = new SongInstrumentProcess(
      id,
      SongInstrumentProcessStatus.completed(),
      gcsPath,
      fileSize,
      codec,
      ffprobeLog
    );
    process.record(
      new SongInstrumentProcessCompletedDomainEvent({
        aggregateId: id.value,
        url: gcsPath.value,
        duration: SongInstrumentProcess.resolveDuration(ffprobeLog),
        size: fileSize.value
      })
    );
    return process;
  }

  private static resolveDuration(ffprobeLog: FfprobeLog): number {
    const rawFfprobeLog = ffprobeLog.value as Record<string, unknown>;
    const duration = rawFfprobeLog.durationInSeconds;

    if (typeof duration !== 'number') {
      throw new InvalidArgumentException({
        message: 'Song instrument process completion requires ffprobe durationInSeconds'
      });
    }

    return duration;
  }

  static fail(id: SongInstrumentProcessId, errorMsg: string): SongInstrumentProcess {
    const process = new SongInstrumentProcess(
      id,
      SongInstrumentProcessStatus.failed(),
      null,
      null,
      null,
      new FfprobeLog({ error: errorMsg })
    );
    process.record(new SongInstrumentProcessFailedDomainEvent({ aggregateId: id.value }));
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
  }): SongInstrumentProcess {
    return new SongInstrumentProcess(
      new SongInstrumentProcessId(plainData.id),
      new SongInstrumentProcessStatus(plainData.status),
      plainData.gcsPath ? new GcsPath(plainData.gcsPath) : null,
      plainData.fileSize === null ? null : new FileSize(plainData.fileSize),
      plainData.codec ? new Codec(plainData.codec) : null,
      new FfprobeLog(plainData.ffprobeLog),
      new SongInstrumentProcessUpdatedAt(plainData.updatedAt)
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
