import { describe, it, expect } from 'vitest';
import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';
import { SongInstrumentMother } from './SongInstrumentMother.js';

describe('SongInstrument should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = SongInstrumentMother.random();
      const primitives = model.toPrimitives();
      const newModel = SongInstrument.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });

  describe('#clearUploadAttempt', () => {
    it('clears the active upload attempt when the id matches', () => {
      const model = SongInstrumentMother.create({ activeUploadAttemptId: null });
      model.activateUploadAttempt('11111111-1111-1111-1111-111111111111');

      model.clearUploadAttempt('11111111-1111-1111-1111-111111111111');

      expect(model.activeUploadAttemptId).toBeNull();
    });

    it('does nothing when the id does not match the active attempt', () => {
      const model = SongInstrumentMother.create({ activeUploadAttemptId: null });
      model.activateUploadAttempt('11111111-1111-1111-1111-111111111111');

      model.clearUploadAttempt('22222222-2222-2222-2222-222222222222');

      expect(model.activeUploadAttemptId?.value).toBe('11111111-1111-1111-1111-111111111111');
    });

    it('does nothing when there is no active attempt', () => {
      const model = SongInstrumentMother.create({ activeUploadAttemptId: null });

      model.clearUploadAttempt('11111111-1111-1111-1111-111111111111');

      expect(model.activeUploadAttemptId).toBeNull();
    });
  });
});
