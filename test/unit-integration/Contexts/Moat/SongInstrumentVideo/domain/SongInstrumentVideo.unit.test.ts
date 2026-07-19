import { describe, it, expect } from 'vitest';
import {
  SongInstrumentVideo,
  SongInstrumentVideoPrimitives
} from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import { SongInstrumentVideoMother } from './SongInstrumentVideoMother.js';
import { SongInstrumentVideoCreatedDomainEventMother } from './SongInstrumentVideoCreatedDomainEventMother.js';
import { FakeClock } from '@Test/utils/mocks/FakeClock.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('SongInstrumentVideo should', () => {
  describe('#fromPrimitives and #toPrimitives', () => {
    it('ensure that the object is correctly serialized and deserialized', () => {
      const model = SongInstrumentVideoMother.random();
      const primitives = model.toPrimitives();
      const newModel = SongInstrumentVideo.fromPrimitives(primitives);
      expect(newModel).toEqual(model);
    });

    it('record a created domain event when it is created', () => {
      const clock = new FakeClock(new Date('2026-01-02T03:04:05.000Z'));
      const model = SongInstrumentVideoMother.create();

      const createdModel = SongInstrumentVideo.create(
        {
          id: model.id.value,
          size: model.size.value,
          duration: model.duration.value,
          url: model.url.value,
          songInstrumentId: model.songInstrumentId.value
        },
        clock
      );

      const [domainEvent] = createdModel.pullDomainEvents();
      const primitives: SongInstrumentVideoPrimitives = createdModel.toPrimitives();

      expect(domainEvent.eventName).toBe('rubricae.moat.1.command.songinstrumentvideo.created');
      expect(domainEvent.aggregateId).toBe(createdModel.id.value);
      expect(domainEvent.attributes).toEqual(
        SongInstrumentVideoCreatedDomainEventMother.fromModel(createdModel).attributes
      );
      expect(primitives.startTimeMs).toBe(0);
    });

    it('throw when sync start time exceeds the video duration in milliseconds', () => {
      const model = SongInstrumentVideoMother.create();

      const primitives: SongInstrumentVideoPrimitives = {
        ...model.toPrimitives(),
        startTimeMs: model.duration.value * 1000 + 1
      };

      expect(() => SongInstrumentVideo.fromPrimitives(primitives)).toThrow(InvalidArgumentException);
    });
  });
});
