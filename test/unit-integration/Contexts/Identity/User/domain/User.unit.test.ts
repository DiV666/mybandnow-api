import { describe, it, expect } from 'vitest';
import { User } from '@Contexts/Mybandnow/User/domain/User.js';
import { UserMother } from './UserMother.js';

describe('User should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = UserMother.random();
      const primitives = model.toPrimitives();
      const newModel = User.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });
  });
});
