import { describe, it, expect } from 'vitest';
import { Track } from '../../../../../../src/Contexts/Moat/Track/domain/Track.js';
import { TrackMother } from './TrackMother.js';

describe('Track should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = TrackMother.random();
      const primitives = model.toPrimitives();
      const newModel = Track.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });
});
