import { describe, it, expect } from 'vitest';
import { Videoclip } from '../../../../../../src/Contexts/Moat/Videoclip/domain/Videoclip.js';
import { VideoclipMother } from './VideoclipMother.js';

describe('Videoclip should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = VideoclipMother.random();
      const primitives = model.toPrimitives();
      const newModel = Videoclip.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });
});
