import { Given } from '@cucumber/cucumber';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';
import { MybandnowWorld } from './MybandnowWorld.js';

Given(
  'An existing videoclip process with id {string} for song {string} and status {string}',
  async function (this: MybandnowWorld, videoclipProcessId: string, songId: string, status: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedVideoclipProcessId = this.dataUtil.replaceTokensWithCustomOrFakerValues(videoclipProcessId) as string;
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;

    await prisma.videoclipProcess.upsert({
      where: { id: resolvedVideoclipProcessId },
      update: {
        songId: resolvedSongId,
        status
      },
      create: {
        id: resolvedVideoclipProcessId,
        songId: resolvedSongId,
        status
      }
    });
  }
);
