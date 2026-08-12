import { describe, it, expect } from 'vitest';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { VideoclipProcessStatusValues } from '@Contexts/Orchestrator/VideoclipProcess/domain/value-object/VideoclipProcessStatus.js';
import { VideoclipRequestedDomainEvent } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipRequestedDomainEvent.js';

const ID = '12345678-1234-4234-8234-123456789012';
const SONG_ID = '22345678-1234-4234-8234-123456789012';
const SONG_INSTRUMENT_ID = '32345678-1234-4234-8234-123456789012';

describe('VideoclipProcess', () => {
  describe('request', () => {
    it('creates a process with PENDING status and the given songId', () => {
      const instruments = [{ songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4' }];

      const process = VideoclipProcess.request(ID, SONG_ID, instruments);

      expect(process.id.value).toBe(ID);
      expect(process.songId.value).toBe(SONG_ID);
      expect(process.status.value).toBe(VideoclipProcessStatusValues.PENDING);
      expect(process.aiResponse).toBeNull();
      expect(process.finalGcsPath).toBeNull();
      expect(process.aiPayload).toEqual({ instruments });
    });

    it('records a VideoclipRequestedDomainEvent with the songId and instruments', () => {
      const instruments = [{ songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4' }];

      const process = VideoclipProcess.request(ID, SONG_ID, instruments);
      const events = process.pullDomainEvents();

      expect(events).toHaveLength(1);
      const event = events[0] as VideoclipRequestedDomainEvent;
      expect(event).toBeInstanceOf(VideoclipRequestedDomainEvent);
      expect(event.aggregateId).toBe(ID);
      expect(event.attributes.songId).toBe(SONG_ID);
      expect(event.attributes.instruments).toEqual(instruments);
    });
  });

  describe('fromPrimitives / toPrimitives', () => {
    it('round-trips primitives', () => {
      const startedAt = new Date('2026-08-01T00:00:00.000Z');
      const updatedAt = new Date('2026-08-02T00:00:00.000Z');

      const process = VideoclipProcess.fromPrimitives({
        id: ID,
        status: VideoclipProcessStatusValues.MIXING,
        songId: SONG_ID,
        aiPayload: { instruments: [] },
        aiResponse: null,
        finalGcsPath: null,
        startedAt,
        updatedAt
      });

      expect(process.toPrimitives()).toEqual({
        id: ID,
        status: VideoclipProcessStatusValues.MIXING,
        songId: SONG_ID,
        aiPayload: { instruments: [] },
        aiResponse: null,
        finalGcsPath: null,
        startedAt,
        updatedAt
      });
    });
  });
});
