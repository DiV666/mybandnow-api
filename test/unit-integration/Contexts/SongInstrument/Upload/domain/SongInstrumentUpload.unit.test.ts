import { describe, it, expect } from 'vitest';
import { SongInstrumentUpload } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/SongInstrumentUpload.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { FileReference } from '../../../../../../src/Contexts/Shared/domain/value-object/FileReference.js';
import { SongInstrumentUploadMother } from './SongInstrumentUploadMother.js';
import { SongInstrumentUploadStatusMother } from './SongInstrumentUploadStatusMother.js';

describe('SongInstrumentUpload should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = SongInstrumentUploadMother.random();
      const primitives = model.toPrimitives();
      const newModel = SongInstrumentUpload.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });

    it('serializes the explicit song instrument relation', () => {
      const model = SongInstrumentUploadMother.create();

      expect(model.toPrimitives()).toEqual(
        expect.objectContaining({
          songInstrumentId: model.songInstrumentId.value
        })
      );
    });
  });

  describe('#cancel', () => {
    it('moves a pending upload to CANCELLED', () => {
      const model = SongInstrumentUploadMother.create({
        status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PENDING)
      });

      model.cancel();

      expect(model.status.value).toBe(SongInstrumentUploadStatusValues.CANCELLED);
    });

    it.each([
      SongInstrumentUploadStatusValues.PROCESSING,
      SongInstrumentUploadStatusValues.COMPLETED,
      SongInstrumentUploadStatusValues.FAILED,
      SongInstrumentUploadStatusValues.CANCELLED
    ])('refuses to cancel an upload in status %s', (status) => {
      const model = SongInstrumentUploadMother.create({
        status: SongInstrumentUploadStatusMother.create(status)
      });

      expect(() => model.cancel()).toThrow(InvalidArgumentException);
    });
  });

  describe('#processUpload', () => {
    it('is a no-op when the upload is already PROCESSING (idempotent retry)', () => {
      const model = SongInstrumentUploadMother.create({
        status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
      });

      expect(() =>
        model.processUpload(new FileReference('song-instrument-uploads/song/instrument/upload.mp4'))
      ).not.toThrow();
      expect(model.status.value).toBe(SongInstrumentUploadStatusValues.PROCESSING);
      expect(model.pullDomainEvents()).toHaveLength(0);
    });

    it.each([SongInstrumentUploadStatusValues.COMPLETED, SongInstrumentUploadStatusValues.CANCELLED])(
      'refuses to process an upload in status %s',
      (status) => {
        const model = SongInstrumentUploadMother.create({
          status: SongInstrumentUploadStatusMother.create(status)
        });

        expect(() =>
          model.processUpload(new FileReference('song-instrument-uploads/song/instrument/upload.mp4'))
        ).toThrow(InvalidArgumentException);
      }
    );
  });

  describe('#markAsFailed', () => {
    it('sets status, errorMessage and errorCode', () => {
      const model = SongInstrumentUploadMother.create({
        status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
      });

      model.markAsFailed('The uploaded video must use H.264 codec.', 'UNSUPPORTED_CODEC');

      expect(model.status.value).toBe(SongInstrumentUploadStatusValues.FAILED);
      expect(model.errorMessage?.value).toBe('The uploaded video must use H.264 codec.');
      expect(model.errorCode?.value).toBe('UNSUPPORTED_CODEC');
    });

    it('rejects an unrecognized error code', () => {
      const model = SongInstrumentUploadMother.create({
        status: SongInstrumentUploadStatusMother.create(SongInstrumentUploadStatusValues.PROCESSING)
      });

      expect(() => model.markAsFailed('Something went wrong.', 'SOME_UNKNOWN_CODE')).toThrow(InvalidArgumentException);
    });
  });
});
