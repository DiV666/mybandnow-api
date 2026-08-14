import { describe, it, expect } from 'vitest';
import { VideoclipProcess } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipProcess.js';
import { VideoclipProcessStatusValues } from '@Contexts/Orchestrator/VideoclipProcess/domain/value-object/VideoclipProcessStatus.js';
import { VideoclipRequestedDomainEvent } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipRequestedDomainEvent.js';
import { VideoclipCancelledDomainEvent } from '@Contexts/Orchestrator/VideoclipProcess/domain/VideoclipCancelledDomainEvent.js';
import { VideoclipProcessNotCancellableException } from '@Contexts/Orchestrator/VideoclipProcess/domain/exception/VideoclipProcessNotCancellableException.js';

const ID = '12345678-1234-4234-8234-123456789012';
const SONG_ID = '22345678-1234-4234-8234-123456789012';
const SONG_INSTRUMENT_ID = '32345678-1234-4234-8234-123456789012';
const ORIGINAL_VIDEOCLIP_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

describe('VideoclipProcess', () => {
  describe('request', () => {
    it('creates a process with PENDING status and the given songId', () => {
      const instruments = [
        { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4', instrumentName: 'Guitar' }
      ];

      const process = VideoclipProcess.request(ID, SONG_ID, ORIGINAL_VIDEOCLIP_URL, instruments);

      expect(process.id.value).toBe(ID);
      expect(process.songId.value).toBe(SONG_ID);
      expect(process.status.value).toBe(VideoclipProcessStatusValues.PENDING);
      expect(process.aiResponse).toBeNull();
      expect(process.finalGcsPath).toBeNull();
      expect(process.aiPayload).toEqual({ originalVideoclipUrl: ORIGINAL_VIDEOCLIP_URL, instruments });
    });

    it('records a VideoclipRequestedDomainEvent with the songId and instruments', () => {
      const instruments = [
        { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4', instrumentName: 'Guitar' }
      ];

      const process = VideoclipProcess.request(ID, SONG_ID, ORIGINAL_VIDEOCLIP_URL, instruments);
      const events = process.pullDomainEvents();

      expect(events).toHaveLength(1);
      const event = events[0] as VideoclipRequestedDomainEvent;
      expect(event).toBeInstanceOf(VideoclipRequestedDomainEvent);
      expect(event.aggregateId).toBe(ID);
      expect(event.attributes.songId).toBe(SONG_ID);
      expect(event.attributes.originalVideoclipUrl).toBe(ORIGINAL_VIDEOCLIP_URL);
      expect(event.attributes.instruments).toEqual(instruments);
      expect(event.attributes.instruments[0].instrumentName).toBe('Guitar');
    });
  });

  describe('cancel', () => {
    it('cancels a PENDING process, setting status to CANCELLED and updating updatedAt', () => {
      const instruments = [
        { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4', instrumentName: 'Guitar' }
      ];
      const process = VideoclipProcess.request(ID, SONG_ID, ORIGINAL_VIDEOCLIP_URL, instruments);

      const cancelledProcess = process.cancel();

      expect(cancelledProcess.id.value).toBe(ID);
      expect(cancelledProcess.songId.value).toBe(SONG_ID);
      expect(cancelledProcess.status.value).toBe(VideoclipProcessStatusValues.CANCELLED);
      expect(cancelledProcess.updatedAt.value.getTime()).toBeGreaterThanOrEqual(process.startedAt.value.getTime());
    });

    it('records a VideoclipCancelledDomainEvent with the songId', () => {
      const instruments = [
        { songInstrumentId: SONG_INSTRUMENT_ID, videoUrl: 'gs://bucket/video.mp4', instrumentName: 'Guitar' }
      ];
      const process = VideoclipProcess.request(ID, SONG_ID, ORIGINAL_VIDEOCLIP_URL, instruments);
      process.pullDomainEvents();

      const cancelledProcess = process.cancel();
      const events = cancelledProcess.pullDomainEvents();

      expect(events).toHaveLength(1);
      const event = events[0] as VideoclipCancelledDomainEvent;
      expect(event).toBeInstanceOf(VideoclipCancelledDomainEvent);
      expect(event.aggregateId).toBe(ID);
      expect(event.attributes.songId).toBe(SONG_ID);
    });

    it.each(['MIXING', 'SUCCESS', 'FAILED', 'TIMEOUT', 'CANCELLED'])(
      'throws VideoclipProcessNotCancellableException when status is %s',
      (status) => {
        const process = VideoclipProcess.fromPrimitives({
          id: ID,
          status,
          songId: SONG_ID,
          aiPayload: null,
          aiResponse: null,
          finalGcsPath: null,
          startedAt: new Date(),
          updatedAt: new Date()
        });

        expect(() => process.cancel()).toThrow(VideoclipProcessNotCancellableException);
      }
    );
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
