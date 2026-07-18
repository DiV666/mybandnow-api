import { describe, it, expect } from 'vitest';
import { Instruments } from '@Contexts/Moat/Instruments/domain/Instruments.js';
import { InstrumentsMother } from './InstrumentsMother.js';

describe('Instruments should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = InstrumentsMother.random();
      const primitives = model.toPrimitives();
      const newModel = Instruments.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });
});
