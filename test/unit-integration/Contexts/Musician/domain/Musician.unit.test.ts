import { describe, it, expect } from 'vitest';
import { Musician } from '@Contexts/Musician/domain/Musician.js';
import { MusicianMother } from './MusicianMother.js';

describe('Musician should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = MusicianMother.random();
      const primitives = model.toPrimitives();
      const newModel = Musician.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });
});
