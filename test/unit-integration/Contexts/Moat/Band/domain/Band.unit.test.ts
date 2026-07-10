import { describe, it, expect } from 'vitest';
import { Band } from '@Contexts/Moat/Band/domain/Band.js';
import { BandMother } from './BandMother.js';

describe('Band should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = BandMother.random();
      const primitives = model.toPrimitives();
      const newModel = Band.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });
});
