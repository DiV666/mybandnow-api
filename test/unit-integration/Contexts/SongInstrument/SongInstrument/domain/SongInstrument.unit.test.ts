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
});
