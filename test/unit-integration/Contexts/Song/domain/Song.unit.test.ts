import { describe, expect, it } from 'vitest';
import { Song } from '@Contexts/Song/domain/Song.js';
import { SongMother } from './SongMother.js';

describe('Song should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = SongMother.random();
      const primitives = model.toPrimitives();
      const newModel = Song.fromPrimitives(primitives);

      expect(newModel).toEqual(model);
    });
  });

  describe('#create', () => {
    it('record a created domain event with the aggregate creation payload', () => {
      const song = Song.create({
        id: '123e4567-e89b-12d3-a456-426614174000',
        bandId: '123e4567-e89b-12d3-a456-426614174001',
        title: 'My Song',
        originalVideoclipUrl: 'https://cdn.example.com/original.mp4'
      });

      expect(song.toPrimitives()).toEqual(
        expect.objectContaining({
          originalVideoClipDurationSeconds: null
        })
      );
      expect(song.pullDomainEvents()).toEqual([
        expect.objectContaining({
          aggregateId: '123e4567-e89b-12d3-a456-426614174000',
          attributes: expect.objectContaining({
            bandId: '123e4567-e89b-12d3-a456-426614174001',
            title: 'My Song',
            originalVideoclipUrl: 'https://cdn.example.com/original.mp4'
          })
        })
      ]);
    });
  });
});
