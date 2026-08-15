import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { VideoclipProcessId } from './value-object/VideoclipProcessId.js';
import { VideoclipProcessSongId } from './value-object/VideoclipProcessSongId.js';
import { VideoclipProcessStatus } from './value-object/VideoclipProcessStatus.js';
import { VideoclipProcessStartedAt } from './value-object/VideoclipProcessStartedAt.js';
import { VideoclipProcessUpdatedAt } from './value-object/VideoclipProcessUpdatedAt.js';
import {
  VideoclipRequestedDomainEvent,
  VideoclipRequestedInstrumentAttributes
} from './VideoclipRequestedDomainEvent.js';
import { VideoclipCancelledDomainEvent } from './VideoclipCancelledDomainEvent.js';
import { VideoclipCompletedDomainEvent } from './VideoclipCompletedDomainEvent.js';
import { VideoclipFailedDomainEvent } from './VideoclipFailedDomainEvent.js';
import { VideoclipProcessNotCancellableException } from './exception/VideoclipProcessNotCancellableException.js';
import { VideoclipProcessNotCompletableException } from './exception/VideoclipProcessNotCompletableException.js';
import { VideoclipProcessNotFailableException } from './exception/VideoclipProcessNotFailableException.js';

export type VideoclipProcessPrimitives = {
  id: string;
  status: string;
  songId: string;
  aiPayload: Record<string, unknown> | null;
  aiResponse: Record<string, unknown> | null;
  finalGcsPath: string | null;
  startedAt: Date;
  updatedAt: Date;
};

export class VideoclipProcess extends AggregateRoot {
  constructor(
    readonly id: VideoclipProcessId,
    readonly status: VideoclipProcessStatus,
    readonly songId: VideoclipProcessSongId,
    readonly aiPayload: Record<string, unknown> | null,
    readonly aiResponse: Record<string, unknown> | null,
    readonly finalGcsPath: string | null,
    readonly startedAt: VideoclipProcessStartedAt,
    readonly updatedAt: VideoclipProcessUpdatedAt
  ) {
    super();
  }

  static request(
    id: string,
    songId: string,
    originalVideoclipUrl: string,
    instruments: Array<VideoclipRequestedInstrumentAttributes>
  ): VideoclipProcess {
    const now = new Date();
    const process = new VideoclipProcess(
      new VideoclipProcessId(id),
      VideoclipProcessStatus.pending(),
      new VideoclipProcessSongId(songId),
      { originalVideoclipUrl, instruments },
      null,
      null,
      new VideoclipProcessStartedAt(now),
      new VideoclipProcessUpdatedAt(now)
    );

    process.record(
      new VideoclipRequestedDomainEvent({
        aggregateId: id,
        songId,
        originalVideoclipUrl,
        instruments
      })
    );

    return process;
  }

  cancel(): VideoclipProcess {
    if (!this.status.isPending()) {
      throw new VideoclipProcessNotCancellableException(this.id.value, this.status.value);
    }

    const cancelledProcess = new VideoclipProcess(
      this.id,
      VideoclipProcessStatus.cancelled(),
      this.songId,
      this.aiPayload,
      this.aiResponse,
      this.finalGcsPath,
      this.startedAt,
      new VideoclipProcessUpdatedAt(new Date())
    );

    cancelledProcess.record(
      new VideoclipCancelledDomainEvent({ aggregateId: this.id.value, songId: this.songId.value })
    );

    return cancelledProcess;
  }

  complete(finalGcsPath: string): VideoclipProcess {
    if (!this.status.isActive()) {
      throw new VideoclipProcessNotCompletableException(this.id.value, this.status.value);
    }

    const completedProcess = new VideoclipProcess(
      this.id,
      VideoclipProcessStatus.success(),
      this.songId,
      this.aiPayload,
      this.aiResponse,
      finalGcsPath,
      this.startedAt,
      new VideoclipProcessUpdatedAt(new Date())
    );

    completedProcess.record(
      new VideoclipCompletedDomainEvent({ aggregateId: this.id.value, songId: this.songId.value, finalGcsPath })
    );

    return completedProcess;
  }

  fail(errorCode: string, errorMessage: string, failedPhase: string): VideoclipProcess {
    if (!this.status.isActive()) {
      throw new VideoclipProcessNotFailableException(this.id.value, this.status.value);
    }

    const failedStatus =
      errorCode === 'SLA_TIMEOUT' ? VideoclipProcessStatus.timeout() : VideoclipProcessStatus.failed();

    const failedProcess = new VideoclipProcess(
      this.id,
      failedStatus,
      this.songId,
      this.aiPayload,
      { errorCode, errorMessage, failedPhase },
      this.finalGcsPath,
      this.startedAt,
      new VideoclipProcessUpdatedAt(new Date())
    );

    failedProcess.record(
      new VideoclipFailedDomainEvent({
        aggregateId: this.id.value,
        songId: this.songId.value,
        errorCode,
        errorMessage,
        failedPhase
      })
    );

    return failedProcess;
  }

  static fromPrimitives(plainData: VideoclipProcessPrimitives): VideoclipProcess {
    return new VideoclipProcess(
      new VideoclipProcessId(plainData.id),
      VideoclipProcessStatus.fromString(plainData.status),
      new VideoclipProcessSongId(plainData.songId),
      plainData.aiPayload,
      plainData.aiResponse,
      plainData.finalGcsPath,
      new VideoclipProcessStartedAt(plainData.startedAt),
      new VideoclipProcessUpdatedAt(plainData.updatedAt)
    );
  }

  toPrimitives(): VideoclipProcessPrimitives {
    return {
      id: this.id.value,
      status: this.status.value,
      songId: this.songId.value,
      aiPayload: this.aiPayload,
      aiResponse: this.aiResponse,
      finalGcsPath: this.finalGcsPath,
      startedAt: this.startedAt.value,
      updatedAt: this.updatedAt.value
    };
  }
}
