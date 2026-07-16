import assert from 'node:assert/strict';
import { Given } from '@cucumber/cucumber';
import { v5 as uuidv5 } from 'uuid';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { MybandnowWorld } from './MybandnowWorld.js';

const BAND_MEMBER_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

Given(
  'A band membership exists for musician {string} in the song {string} band',
  async function (this: MybandnowWorld, musicianId: string, songId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedMusicianId = this.dataUtil.replaceTokensWithCustomOrFakerValues(musicianId) as string;
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const song = await prisma.song.findUnique({
      where: { id: resolvedSongId },
      select: { bandId: true }
    });

    assert.ok(song, `Song ${resolvedSongId} not found`);

    await prisma.bandMember.upsert({
      where: {
        musicianId_bandId: {
          musicianId: resolvedMusicianId,
          bandId: song.bandId
        }
      },
      update: {
        role: 'MEMBER'
      },
      create: {
        id: uuidv5(`band-member-${resolvedSongId}-${resolvedMusicianId}`, BAND_MEMBER_NAMESPACE),
        role: 'MEMBER',
        musicianId: resolvedMusicianId,
        bandId: song.bandId
      }
    });
  }
);

Given(
  'An existing song instrument with id {string} for song {string} and musician {string}',
  async function (this: MybandnowWorld, instrumentId: string, songId: string, musicianId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedInstrumentId = this.dataUtil.replaceTokensWithCustomOrFakerValues(instrumentId) as string;
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const resolvedMusicianId = this.dataUtil.replaceTokensWithCustomOrFakerValues(musicianId) as string;

    await prisma.songInstrument.upsert({
      where: { id: resolvedInstrumentId },
      update: {
        name: 'Lead Guitar',
        instrumentType: 'guitar',
        songId: resolvedSongId,
        musicianId: resolvedMusicianId
      },
      create: {
        id: resolvedInstrumentId,
        name: 'Lead Guitar',
        instrumentType: 'guitar',
        songId: resolvedSongId,
        musicianId: resolvedMusicianId
      }
    });
  }
);

Given(
  'A song instrument video exists with id {string} for song instrument {string}',
  async function (this: MybandnowWorld, videoId: string, instrumentId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedVideoId = this.dataUtil.replaceTokensWithCustomOrFakerValues(videoId) as string;
    const resolvedInstrumentId = this.dataUtil.replaceTokensWithCustomOrFakerValues(instrumentId) as string;

    await prisma.songInstrumentVideo.upsert({
      where: { id: resolvedVideoId },
      update: {
        songInstrumentId: resolvedInstrumentId,
        url: 'https://example.com/song-instrument-video.mp4',
        duration: 123,
        size: 456
      },
      create: {
        id: resolvedVideoId,
        songInstrumentId: resolvedInstrumentId,
        url: 'https://example.com/song-instrument-video.mp4',
        duration: 123,
        size: 456
      }
    });
  }
);

Given(
  'An active failed song instrument upload attempt with id {string} exists for song instrument {string}',
  async function (this: MybandnowWorld, uploadAttemptId: string, instrumentId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedUploadAttemptId = this.dataUtil.replaceTokensWithCustomOrFakerValues(uploadAttemptId) as string;
    const resolvedInstrumentId = this.dataUtil.replaceTokensWithCustomOrFakerValues(instrumentId) as string;
    const songInstrument = await prisma.songInstrument.findUnique({
      where: { id: resolvedInstrumentId },
      select: {
        songId: true,
        name: true
      }
    });

    assert.ok(songInstrument, `Song instrument ${resolvedInstrumentId} not found`);

    await prisma.songInstrumentUpload.upsert({
      where: { id: resolvedUploadAttemptId },
      update: {
        instrumentName: songInstrument.name,
        songId: songInstrument.songId,
        songInstrumentId: resolvedInstrumentId,
        status: 'FAILED',
        errorMessage: 'Upload processing failed. Please try again.'
      },
      create: {
        id: resolvedUploadAttemptId,
        instrumentName: songInstrument.name,
        songId: songInstrument.songId,
        songInstrumentId: resolvedInstrumentId,
        status: 'FAILED',
        errorMessage: 'Upload processing failed. Please try again.'
      }
    });

    await prisma.songInstrument.update({
      where: { id: resolvedInstrumentId },
      data: {
        activeUploadAttemptId: resolvedUploadAttemptId
      }
    });
  }
);
