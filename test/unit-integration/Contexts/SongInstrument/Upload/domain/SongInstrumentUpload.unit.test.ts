import { describe, it, expect } from 'vitest';
import { SongInstrumentUpload } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/SongInstrumentUpload.js';
import { SongInstrumentUploadMother } from './SongInstrumentUploadMother.js';

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
});
