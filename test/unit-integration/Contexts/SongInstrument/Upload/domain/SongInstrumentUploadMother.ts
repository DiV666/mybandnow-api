import { SongInstrumentUpload } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/SongInstrumentUpload.js';
import { SongInstrumentUploadIdMother } from './SongInstrumentUploadIdMother.js';
import { Repeater } from '../../../Shared/domain/value-object/Repeater.js';
import { SongInstrumentUploadCreatedAtMother } from './SongInstrumentUploadCreatedAtMother.js';
import { SongInstrumentUploadSongIdMother } from './SongInstrumentUploadSongIdMother.js';
import { SongInstrumentUploadInstrumentNameMother } from './SongInstrumentUploadInstrumentNameMother.js';
import { SongInstrumentUploadSongInstrumentIdMother } from './SongInstrumentUploadSongInstrumentIdMother.js';
import { SongInstrumentUploadStatusMother } from './SongInstrumentUploadStatusMother.js';

export class SongInstrumentUploadMother {
  private static defaults(): Partial<SongInstrumentUpload> {
    return {
      id: SongInstrumentUploadIdMother.random(),
      status: SongInstrumentUploadStatusMother.random(),
      instrumentName: SongInstrumentUploadInstrumentNameMother.random(),
      songInstrumentId: SongInstrumentUploadSongInstrumentIdMother.random(),
      songId: SongInstrumentUploadSongIdMother.random(),
      createdAt: SongInstrumentUploadCreatedAtMother.now(),
      errorMessage: null,
      errorCode: null
    };
  }

  static create(...params: Partial<SongInstrumentUpload>[]): SongInstrumentUpload {
    const data: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = Object.assign(
      {},
      SongInstrumentUploadMother.defaults(),
      ...params
    );

    const errorMessage = typeof data.errorMessage?.value === 'string' ? data.errorMessage.value : null;
    const errorCode = typeof data.errorCode?.value === 'string' ? data.errorCode.value : null;

    return SongInstrumentUpload.fromPrimitives({
      id: data.id.value,
      status: data.status.value,
      instrumentName: data.instrumentName.value,
      songInstrumentId: data.songInstrumentId.value,
      songId: data.songId.value,
      createdAt: data.createdAt.value.toISOString(),
      errorMessage,
      errorCode
    });
  }

  static random(): SongInstrumentUpload {
    return SongInstrumentUploadMother.create(SongInstrumentUploadMother.defaults());
  }

  static createList(): Array<SongInstrumentUpload> {
    return Repeater.random(SongInstrumentUploadMother.create);
  }
}
