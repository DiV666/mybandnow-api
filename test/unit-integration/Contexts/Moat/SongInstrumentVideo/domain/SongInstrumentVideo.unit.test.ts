import { describe, it, expect } from 'vitest';
import {
  SongInstrumentVideo,
  SongInstrumentVideoPrimitives
} from '@Contexts/Moat/SongInstrumentVideo/domain/SongInstrumentVideo.js';
import { SongInstrumentVideoMother } from './SongInstrumentVideoMother.js';
import { SongInstrumentVideoCreatedDomainEventMother } from './SongInstrumentVideoCreatedDomainEventMother.js';
import { FakeClock } from '@Test/utils/mocks/FakeClock.js';

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

    it('allow a sync start time greater than the video duration in milliseconds', () => {
      const model = SongInstrumentVideoMother.create();

      const primitives: SongInstrumentVideoPrimitives = {
        ...model.toPrimitives(),
        startTimeMs: model.duration.value * 1000 + 1
      };

      const newModel = SongInstrumentVideo.fromPrimitives(primitives);

      expect(newModel.startTimeMs.value).toBe(primitives.startTimeMs);
    });
  });

  describe('#updateStartTimeMs', () => {
    it('record an updated domain event when the start time changes', () => {
      const model = SongInstrumentVideoMother.create();
      const updatedModel = model.updateStartTimeMs(model.duration.value * 1000 + 5000);
      const [domainEvent] = updatedModel.pullDomainEvents();

      expect(updatedModel.startTimeMs.value).toBe(model.duration.value * 1000 + 5000);
      expect(domainEvent.eventName).toBe('rubricae.moat.1.command.songinstrumentvideo.updated');
      expect(domainEvent.aggregateId).toBe(model.id.value);
      expect(domainEvent.attributes).toEqual({
        createdAt: updatedModel.createdAt.value.toISOString(),
        size: updatedModel.size.value,
        duration: updatedModel.duration.value,
        url: updatedModel.url.value,
        songInstrumentId: updatedModel.songInstrumentId.value,
        startTimeMs: updatedModel.startTimeMs.value
      });
    });

    it('not record a domain event when the start time does not change', () => {
      const model = SongInstrumentVideoMother.create();
      const updatedModel = model.updateStartTimeMs(model.startTimeMs.value);

      expect(updatedModel).toBe(model);
      expect(updatedModel.pullDomainEvents()).toEqual([]);
    });
  });

  describe('#replaceUpload', () => {
    it('reset startTimeMs and record a replaced domain event when the upload changes', () => {
      const model = SongInstrumentVideoMother.create();
      const replacedModel = model.replaceUpload({
        size: model.size.value + 10,
        duration: model.duration.value + 20,
        url: `${model.url.value}-replaced`
      });
      const [domainEvent] = replacedModel.pullDomainEvents();

      expect(replacedModel.startTimeMs.value).toBe(0);
      expect(replacedModel.size.value).toBe(model.size.value + 10);
      expect(replacedModel.duration.value).toBe(model.duration.value + 20);
      expect(replacedModel.url.value).toBe(`${model.url.value}-replaced`);
      expect(domainEvent.eventName).toBe('rubricae.moat.1.command.songinstrumentvideo.replaced');
      expect(domainEvent.aggregateId).toBe(model.id.value);
      expect(domainEvent.attributes).toEqual({
        songInstrumentId: model.songInstrumentId.value,
        oldUrl: model.url.value,
        newUrl: `${model.url.value}-replaced`
      });
    });
  });
});
