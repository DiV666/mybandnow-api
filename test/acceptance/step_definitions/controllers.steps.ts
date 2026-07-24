import assert from 'assert';
import * as fs from 'fs';
import { After, AfterAll, Before, Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import container from '../../apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '../../utils/arranger/EnvironmentArranger.js';
import { MybandnowWorld } from './MybandnowWorld.js';
import jsonwebtoken from 'jsonwebtoken';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { UuidMother } from '../../unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

setDefaultTimeout(20000);

import { v5 as uuidv5 } from 'uuid';
import { PasswordEncryptor } from '@Contexts/Mybandnow/User/domain/service/PasswordEncryptor.js';
import { UserPersistenceRepository } from '@Contexts/Mybandnow/User/domain/repository/UserPersistenceRepository.js';
import { MusicianRepository } from '@Contexts/Moat/Musician/domain/repository/MusicianRepository.js';
import { User } from '@Contexts/Mybandnow/User/domain/User.js';
import { UserId } from '@Contexts/Mybandnow/User/domain/value-object/UserId.js';
import { UserEmail } from '@Contexts/Mybandnow/User/domain/value-object/UserEmail.js';
import { UserPassword } from '@Contexts/Mybandnow/User/domain/value-object/UserPassword.js';
import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';
import { MusicianId } from '@Contexts/Moat/Musician/domain/value-object/MusicianId.js';
import { MusicianUserId } from '@Contexts/Moat/Musician/domain/value-object/MusicianUserId.js';
import { MusicianName } from '@Contexts/Moat/Musician/domain/value-object/MusicianName.js';
import { MusicianUsername } from '@Contexts/Moat/Musician/domain/value-object/MusicianUsername.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const DEFAULT_CATALOG_INSTRUMENT_ID = '0e7a0d5f-3d2a-4bc1-8d4d-100000000001';

Given(
  'An authenticated user {string} with password {string}',
  async function (this: MybandnowWorld, username: string, password: string) {
    const userIdValue = await saveAuthenticatedUser(username, password);
    const accessToken = await getToken(username, userIdValue);
    this.setAuthToken(accessToken);
  }
);

Given(
  'An authenticated admin user {string} with password {string}',
  async function (this: MybandnowWorld, username: string, password: string) {
    const userIdValue = await saveAuthenticatedUser(username, password);
    const accessToken = await getToken(username, userIdValue, ['admin-scope']);
    this.setAuthToken(accessToken);
  }
);

Given(
  'I authenticate as user {string} with id {string}',
  async function (this: MybandnowWorld, username: string, userId: string) {
    userId = this.dataUtil.replaceTokensWithCustomOrFakerValues(userId) as string;
    const accessToken = await getToken(username, userId);
    this.setAuthToken(accessToken);
  }
);

Given(
  'I authenticate as admin user {string} with id {string}',
  async function (this: MybandnowWorld, username: string, userId: string) {
    userId = this.dataUtil.replaceTokensWithCustomOrFakerValues(userId) as string;
    const accessToken = await getToken(username, userId, ['admin-scope']);
    this.setAuthToken(accessToken);
  }
);

Given('they have a musician profile', async function (this: MybandnowWorld) {
  if (!this.authToken)
    throw new Error('No auth token found. Cannot create musician profile without an authenticated user.');
  const payload = jsonwebtoken.decode(this.authToken) as jsonwebtoken.JwtPayload;
  const username = payload.preferred_username as string | undefined;
  const userIdValue = authenticatedUserIdFromPayload(payload);

  if (!username) {
    throw new Error('No preferred_username found. Cannot create musician profile without a username.');
  }

  await saveMusicianProfile({ username, userIdValue });
});

Given('another musician already exists with username {string}', async function (username: string) {
  const userIdValue = uuidv5(`existing-${username}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');

  await savePersistedUser(username, userIdValue, 'asdASD123!');
  await saveMusicianProfile({ username, userIdValue });
});

Given(
  'A musician exists with id {string}, user id {string}, and username {string}',
  async function (this: MybandnowWorld, musicianId: string, userIdValue: string, username: string) {
    musicianId = this.dataUtil.replaceTokensWithCustomOrFakerValues(musicianId) as string;
    userIdValue = this.dataUtil.replaceTokensWithCustomOrFakerValues(userIdValue) as string;
    await savePersistedUser(username, userIdValue, 'asdASD123!');
    await saveMusicianProfile({ musicianId, username, userIdValue });
  }
);

Given('An internal authenticated user', function (this: MybandnowWorld) {
  const token = jsonwebtoken.sign(
    {
      userId: UuidMother.random(),
      companyId: UuidMother.random(),
      partnerId: UuidMother.random()
    },
    internalPrivateKey(),
    {
      algorithm: 'RS256'
    }
  );

  this.setAuthToken(token, 'x-internal-auth');
});

Given(
  'An {string} parameter with value as {string}:',
  async function (this: MybandnowWorld, key: string, type: string, value: string) {
    if (type === 'json') {
      value = JSON.parse(value);
    }
    this.dataUtil.addPersonalizedParameterAndValue(key, value);
  }
);

Given('An user with apikey {string}', function (this: MybandnowWorld, apikey: string) {
  this.setAuthToken(apikey);
});

When(
  'I send a POST request to {string} with body:',
  async function (this: MybandnowWorld, route: string, body: string) {
    route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
    const data = this.dataUtil.replaceTokensWithCustomOrFakerValues(JSON.parse(body)) as Record<string, unknown>;
    const req = this.request.post(route).send(data);
    attachAuthHeader(this, req);
    this.response = await req;
  }
);

When('I send a GET request to {string}', async function (this: MybandnowWorld, route: string) {
  route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
  const req = this.request.get(route);
  attachAuthHeader(this, req);
  this.response = await req;
});

When('I send a PUT request to {string} with body:', async function (this: MybandnowWorld, route: string, body: string) {
  route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
  const data = this.dataUtil.replaceTokensWithCustomOrFakerValues(JSON.parse(body)) as Record<string, unknown>;
  const req = this.request.put(route).send(data);
  attachAuthHeader(this, req);
  this.response = await req;
});

When('I send a DELETE request to {string}', async function (this: MybandnowWorld, route: string) {
  route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
  const req = this.request.delete(route);
  attachAuthHeader(this, req);
  this.response = await req;
});

When(
  'I send a multipart POST request to {string} with a valid MP4 video',
  async function (this: MybandnowWorld, route: string) {
    route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
    const req = this.request.post(route).attach('video', createValidMp4Buffer(), {
      filename: 'track.mp4',
      contentType: 'video/mp4'
    });
    attachAuthHeader(this, req);
    this.response = await req;
  }
);

When(
  'I send a multipart POST request to {string} without a video file',
  async function (this: MybandnowWorld, route: string) {
    route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
    const req = this.request.post(route).field('note', 'missing-video');
    attachAuthHeader(this, req);
    this.response = await req;
  }
);

When(
  'I send a multipart POST request to {string} with an invalid video mime type',
  async function (this: MybandnowWorld, route: string) {
    route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
    const req = this.request.post(route).attach('video', Buffer.from('plain-text-upload'), {
      filename: 'track.txt',
      contentType: 'text/plain'
    });
    attachAuthHeader(this, req);
    this.response = await req;
  }
);

When(
  'I send a multipart POST request to {string} with a corrupted MP4 header',
  async function (this: MybandnowWorld, route: string) {
    route = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
    const req = this.request.post(route).attach('video', Buffer.from('6e6f7466747970686561646572', 'hex'), {
      filename: 'track.mp4',
      contentType: 'video/mp4'
    });
    attachAuthHeader(this, req);
    this.response = await req;
  }
);

Then('the response status code should be {int}', function (this: MybandnowWorld, status: number) {
  if (this.response.status !== status) {
    fs.writeFileSync('error_body.txt', JSON.stringify(this.response.body));
    // eslint-disable-next-line no-console
    console.error('Body:', this.response.body);
  }
  assert.equal(this.response.status, status);
});

Then('the response should be:', async function (this: MybandnowWorld, response: string) {
  const expectedResponse = this.dataUtil.replaceTokensWithCustomOrFakerValues(JSON.parse(response));
  assert.deepStrictEqual(this.response.body, expectedResponse);
});

Then(
  'the response with ignored fields {string} should be:',
  async function (this: MybandnowWorld, ignoredFields: string, response: string) {
    const expectedResponse = this.dataUtil.replaceTokensWithCustomOrFakerValues(JSON.parse(response));
    const actualResponse = JSON.parse(JSON.stringify(this.response.body)); // Deep copy to avoid modifying original

    const deleteByPath = (obj: Record<string, unknown>, path: string): void => {
      const parts = path.split('.');
      if (parts.length === 1) {
        delete obj[parts[0]];
        return;
      }
      const next = obj[parts[0]];
      if (Array.isArray(next)) {
        for (const item of next) {
          deleteByPath(item as Record<string, unknown>, parts.slice(1).join('.'));
        }
      } else if (next && typeof next === 'object') {
        deleteByPath(next as Record<string, unknown>, parts.slice(1).join('.'));
      }
    };

    if (Array.isArray(actualResponse)) {
      for (const item of actualResponse) {
        for (const ignoredField of ignoredFields.split(',')) {
          deleteByPath(item as Record<string, unknown>, ignoredField.trim());
        }
      }
    } else {
      for (const ignoredField of ignoredFields.split(',')) {
        deleteByPath(actualResponse, ignoredField.trim());
      }
    }

    assert.deepStrictEqual(actualResponse, expectedResponse);
  }
);

Then('the response should contain {string}', function (this: MybandnowWorld, field: string) {
  assert.ok(this.response.body[field] !== undefined, `Response does not contain field: ${field}`);
});

Then('I use the response access token for authenticated requests', function (this: MybandnowWorld) {
  const accessToken = this.response.body.accessToken;

  assert.equal(typeof accessToken, 'string', 'Response accessToken must be a string');
  this.setAuthToken(accessToken);
});

Then('the response should be empty', function (this: MybandnowWorld) {
  assert.deepStrictEqual(this.response.body, {});
});
Before(async (): Promise<void> => {
  const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
  await (await prismaEnvironmentArranger).arrange();
  clearSongInstrumentStorage();
});

After((): void => {
  clearSongInstrumentStorage();
});

/**
 * Mocks the access token generation locally since Keycloak is removed.
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @return {Promise<string>} The access token.
 */

async function getToken(username: string, userIdValue?: string, extraRoles: string[] = []): Promise<string> {
  const { v5: uuidv5 } = await import('uuid');
  const subId = userIdValue || uuidv5(username, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  const payload = {
    email: `${username}@example.com`,
    roles: ['admin', 'user:create', 'user:read', 'user:update', 'user:delete', ...extraRoles],
    preferred_username: username
  };

  return jsonwebtoken.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
    subject: subId
  });
}

async function saveAuthenticatedUser(username: string, password: string): Promise<string> {
  const userIdValue = uuidv5(username, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  await savePersistedUser(username, userIdValue, password);
  return userIdValue;
}

async function savePersistedUser(username: string, userIdValue: string, password: string): Promise<void> {
  const encryptor = container.get<PasswordEncryptor>('Mybandnow.User.PasswordEncryptor');
  const userRepository = container.get<UserPersistenceRepository>('Mybandnow.User.UserRepository');

  const hashedPassword = await encryptor.hash(password);
  const user = User.create(
    new UserId(userIdValue),
    new UserEmail(`${username}@example.com`),
    new UserPassword(hashedPassword)
  );

  await userRepository.save(user);
}

interface SaveMusicianProfileParams {
  musicianId?: string;
  username: string;
  userIdValue: string;
}

async function saveMusicianProfile({ musicianId, username, userIdValue }: SaveMusicianProfileParams): Promise<void> {
  const musicianRepository = container.get<MusicianRepository>('Moat.Musician.MusicianRepository');
  const musician = new Musician(
    new MusicianId(musicianId ?? MusicianId.random()),
    new MusicianUsername(username),
    new MusicianName(username),
    new MusicianUserId(userIdValue)
  );

  await musicianRepository.save(musician);
}

Given('a {string} track with id {string} exists', async function (status: string, trackId: string) {
  const prisma = PrismaClientFactory.createClient();
  const ownerUserId = uuidv5(`track-owner-${trackId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  const ownerMusicianId = uuidv5(`track-musician-${trackId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  const bandId = uuidv5(`track-band-${trackId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  const songId = uuidv5(`track-song-${trackId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  const songInstrumentId = uuidv5(`track-song-instrument-${trackId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');

  await savePersistedUser(`track-owner-${trackId}`, ownerUserId, 'asdASD123!');

  await prisma.musician.upsert({
    where: { id: ownerMusicianId },
    update: {},
    create: {
      id: ownerMusicianId,
      userId: ownerUserId,
      username: `track-owner-${trackId}`,
      realName: 'Song Instrument Upload Owner',
      instruments: []
    }
  });

  await prisma.band.upsert({
    where: { id: bandId },
    update: {},
    create: {
      id: bandId,
      name: 'Song Instrument Upload Band',
      ownerId: ownerMusicianId
    }
  });

  await prisma.song.upsert({
    where: { id: songId },
    update: {},
    create: {
      id: songId,
      title: 'Song Instrument Upload Song',
      bandId,
      originalVideoclipUrl: 'https://cdn.example.com/song-instrument-upload-source.mp4'
    }
  });

  await prisma.instruments.upsert({
    where: { id: DEFAULT_CATALOG_INSTRUMENT_ID },
    update: {
      name: 'Guitarra',
      description: 'Song instrument acceptance catalog instrument'
    },
    create: {
      id: DEFAULT_CATALOG_INSTRUMENT_ID,
      name: 'Guitarra',
      description: 'Song instrument acceptance catalog instrument'
    }
  });

  await prisma.songInstrument.upsert({
    where: { id: songInstrumentId },
    update: {
      name: 'guitar',
      instrumentId: DEFAULT_CATALOG_INSTRUMENT_ID,
      songId,
      musicianId: ownerMusicianId
    },
    create: {
      id: songInstrumentId,
      name: 'guitar',
      instrumentId: DEFAULT_CATALOG_INSTRUMENT_ID,
      songId,
      musicianId: ownerMusicianId
    }
  });

  await prisma.songInstrumentUpload.upsert({
    where: { id: trackId },
    update: {
      instrumentName: 'guitar',
      songId,
      songInstrumentId,
      status
    },
    create: {
      id: trackId,
      instrumentName: 'guitar',
      songId,
      songInstrumentId,
      status
    }
  });
});

Given(
  'song instrument {string} exists for song {string} assigned to the authenticated musician',
  async function (this: MybandnowWorld, songInstrumentId: string, songId: string) {
    const prisma = PrismaClientFactory.createClient();
    const authenticatedMusician = await getAuthenticatedMusician(this);
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const resolvedSongInstrumentId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songInstrumentId) as string;
    const bandId = uuidv5(`track-song-instrument-band-${resolvedSongId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');

    await prisma.band.upsert({
      where: { id: bandId },
      update: {},
      create: {
        id: bandId,
        name: 'Song Instrument Upload Band',
        ownerId: authenticatedMusician.id
      }
    });

    await prisma.song.upsert({
      where: { id: resolvedSongId },
      update: {
        title: 'Song Instrument Upload Song',
        bandId,
        originalVideoclipUrl: 'https://cdn.example.com/song-instrument-upload-source.mp4'
      },
      create: {
        id: resolvedSongId,
        title: 'Song Instrument Upload Song',
        bandId,
        originalVideoclipUrl: 'https://cdn.example.com/song-instrument-upload-source.mp4'
      }
    });

    await prisma.instruments.upsert({
      where: { id: DEFAULT_CATALOG_INSTRUMENT_ID },
      update: {
        name: 'Guitarra',
        description: 'Song instrument acceptance catalog instrument'
      },
      create: {
        id: DEFAULT_CATALOG_INSTRUMENT_ID,
        name: 'Guitarra',
        description: 'Song instrument acceptance catalog instrument'
      }
    });

    await prisma.songInstrument.upsert({
      where: { id: resolvedSongInstrumentId },
      update: {
        name: 'Lead Guitar',
        instrumentId: DEFAULT_CATALOG_INSTRUMENT_ID,
        songId: resolvedSongId,
        musicianId: authenticatedMusician.id
      },
      create: {
        id: resolvedSongInstrumentId,
        name: 'Lead Guitar',
        instrumentId: DEFAULT_CATALOG_INSTRUMENT_ID,
        songId: resolvedSongId,
        musicianId: authenticatedMusician.id
      }
    });
  }
);

Given(
  'song instrument {string} exists for song {string} assigned to another musician',
  async function (this: MybandnowWorld, songInstrumentId: string, songId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const resolvedSongInstrumentId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songInstrumentId) as string;
    const otherUserId = uuidv5(`other-track-user-${resolvedSongInstrumentId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');
    const otherMusicianId = uuidv5(
      `other-track-musician-${resolvedSongInstrumentId}`,
      '1b671a64-40d5-491e-99b0-da01ff1f3341'
    );
    const bandId = uuidv5(`track-song-instrument-band-${resolvedSongId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');
    const username = `other-track-${resolvedSongInstrumentId}`;

    await savePersistedUser(username, otherUserId, 'asdASD123!');

    await prisma.musician.upsert({
      where: { id: otherMusicianId },
      update: {},
      create: {
        id: otherMusicianId,
        userId: otherUserId,
        username,
        realName: 'Other Song Instrument Upload Musician',
        instruments: []
      }
    });

    await prisma.band.upsert({
      where: { id: bandId },
      update: {},
      create: {
        id: bandId,
        name: 'Song Instrument Upload Band',
        ownerId: otherMusicianId
      }
    });

    await prisma.song.upsert({
      where: { id: resolvedSongId },
      update: {
        title: 'Song Instrument Upload Song',
        bandId,
        originalVideoclipUrl: 'https://cdn.example.com/song-instrument-upload-source.mp4'
      },
      create: {
        id: resolvedSongId,
        title: 'Song Instrument Upload Song',
        bandId,
        originalVideoclipUrl: 'https://cdn.example.com/song-instrument-upload-source.mp4'
      }
    });

    await prisma.instruments.upsert({
      where: { id: DEFAULT_CATALOG_INSTRUMENT_ID },
      update: {
        name: 'Guitarra',
        description: 'Song instrument acceptance catalog instrument'
      },
      create: {
        id: DEFAULT_CATALOG_INSTRUMENT_ID,
        name: 'Guitarra',
        description: 'Song instrument acceptance catalog instrument'
      }
    });

    await prisma.songInstrument.upsert({
      where: { id: resolvedSongInstrumentId },
      update: {
        name: 'Lead Guitar',
        instrumentId: DEFAULT_CATALOG_INSTRUMENT_ID,
        songId: resolvedSongId,
        musicianId: otherMusicianId
      },
      create: {
        id: resolvedSongInstrumentId,
        name: 'Lead Guitar',
        instrumentId: DEFAULT_CATALOG_INSTRUMENT_ID,
        songId: resolvedSongId,
        musicianId: otherMusicianId
      }
    });
  }
);

Given(
  'an internal song instrument upload already exists for song {string} and song instrument {string}',
  async function (this: MybandnowWorld, songId: string, songInstrumentId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const resolvedSongInstrumentId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songInstrumentId) as string;

    await prisma.songInstrumentUpload.create({
      data: {
        id: uuidv5(`track-${resolvedSongInstrumentId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341'),
        instrumentName: 'Lead Guitar',
        songId: resolvedSongId,
        songInstrumentId: resolvedSongInstrumentId,
        status: 'PENDING'
      }
    });
  }
);

async function assertSongInstrumentUploadCount(
  world: MybandnowWorld,
  total: number,
  songId: string,
  songInstrumentId: string
): Promise<void> {
  const prisma = PrismaClientFactory.createClient();
  const resolvedSongId = world.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
  const resolvedSongInstrumentId = world.dataUtil.replaceTokensWithCustomOrFakerValues(songInstrumentId) as string;
  const tracks = await prisma.songInstrumentUpload.findMany({
    where: {
      songId: resolvedSongId,
      songInstrumentId: resolvedSongInstrumentId
    }
  });

  assert.equal(tracks.length, total);
}

Then(
  'exactly {int} internal song instrument upload should exist for song {string} and song instrument {string}',
  async function (this: MybandnowWorld, total: number, songId: string, songInstrumentId: string) {
    await assertSongInstrumentUploadCount(this, total, songId, songInstrumentId);
  }
);

Then(
  'exactly {int} internal song instrument uploads should exist for song {string} and song instrument {string}',
  async function (this: MybandnowWorld, total: number, songId: string, songInstrumentId: string) {
    await assertSongInstrumentUploadCount(this, total, songId, songInstrumentId);
  }
);

Given(
  'An existing band with id {string}, owner {string}, and member {string}',
  async function (this: MybandnowWorld, bandId: string, ownerId: string, memberId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedBandId = this.dataUtil.replaceTokensWithCustomOrFakerValues(bandId) as string;
    const resolvedOwnerId = this.dataUtil.replaceTokensWithCustomOrFakerValues(ownerId) as string;
    const resolvedMemberId = this.dataUtil.replaceTokensWithCustomOrFakerValues(memberId) as string;

    await prisma.band.upsert({
      where: { id: resolvedBandId },
      update: {
        name: 'Acceptance Band',
        ownerId: resolvedOwnerId
      },
      create: {
        id: resolvedBandId,
        name: 'Acceptance Band',
        ownerId: resolvedOwnerId
      }
    });

    await prisma.bandMember.upsert({
      where: {
        musicianId_bandId: {
          musicianId: resolvedMemberId,
          bandId: resolvedBandId
        }
      },
      update: {
        role: 'MEMBER'
      },
      create: {
        id: uuidv5(`band-member-${resolvedBandId}-${resolvedMemberId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341'),
        musicianId: resolvedMemberId,
        bandId: resolvedBandId,
        role: 'MEMBER'
      }
    });
  }
);

Given(
  'An existing song with id {string}, band {string}, and title {string}',
  async function (this: MybandnowWorld, songId: string, bandId: string, title: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const resolvedBandId = this.dataUtil.replaceTokensWithCustomOrFakerValues(bandId) as string;

    await prisma.song.upsert({
      where: { id: resolvedSongId },
      update: {
        title,
        bandId: resolvedBandId,
        originalVideoclipUrl: 'https://cdn.example.com/original.mp4'
      },
      create: {
        id: resolvedSongId,
        title,
        bandId: resolvedBandId,
        originalVideoclipUrl: 'https://cdn.example.com/original.mp4'
      }
    });
  }
);

Given(
  'An existing song with id {string} and musician {string}',
  async function (this: MybandnowWorld, songId: string, musicianId: string) {
    const prisma = PrismaClientFactory.createClient();
    const resolvedSongId = this.dataUtil.replaceTokensWithCustomOrFakerValues(songId) as string;
    const resolvedMusicianId = this.dataUtil.replaceTokensWithCustomOrFakerValues(musicianId) as string;
    const username = `song-instrument-${resolvedMusicianId}`;

    await savePersistedUser(username, resolvedMusicianId, 'asdASD123!');

    await prisma.musician.upsert({
      where: { id: resolvedMusicianId },
      update: {},
      create: {
        id: resolvedMusicianId,
        userId: resolvedMusicianId,
        username,
        realName: 'Song Instrument Musician',
        instruments: []
      }
    });

    const bandId = uuidv5(`song-instrument-band-${resolvedSongId}`, '1b671a64-40d5-491e-99b0-da01ff1f3341');

    await prisma.band.upsert({
      where: { id: bandId },
      update: {},
      create: {
        id: bandId,
        name: 'Song Instrument Band',
        ownerId: resolvedMusicianId
      }
    });

    await prisma.song.upsert({
      where: { id: resolvedSongId },
      update: {
        title: 'Song Instrument Song',
        bandId,
        originalVideoclipUrl: 'https://cdn.example.com/song-instrument-source.mp4'
      },
      create: {
        id: resolvedSongId,
        title: 'Song Instrument Song',
        bandId,
        originalVideoclipUrl: 'https://cdn.example.com/song-instrument-source.mp4'
      }
    });
  }
);

AfterAll(async (): Promise<void> => {
  const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
  await (await prismaEnvironmentArranger).clean();
  await (await prismaEnvironmentArranger).close();
});

function attachAuthHeader(world: MybandnowWorld, req: { set: (field: string, value: string) => unknown }): void {
  if (!world.authToken) {
    return;
  }

  if (world.authHeaderName === 'x-internal-auth') {
    req.set('x-internal-auth', world.authToken);
    return;
  }

  req.set('Authorization', `Bearer ${world.authToken}`);
}

function internalPrivateKey(): string {
  return Buffer.from(env.KLODING_INTERNAL_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
}

function createValidMp4Buffer(): Buffer {
  return Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
}

async function getAuthenticatedMusician(thisWorld: MybandnowWorld): Promise<{ id: string; userId: string }> {
  if (!thisWorld.authToken) {
    throw new Error('No auth token found. Cannot resolve authenticated musician.');
  }

  const payload = jsonwebtoken.decode(thisWorld.authToken) as jsonwebtoken.JwtPayload;
  const userId = authenticatedUserIdFromPayload(payload);
  const prisma = PrismaClientFactory.createClient();
  const musician = await prisma.musician.findFirst({
    where: {
      userId
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!musician) {
    throw new Error(`No musician profile found for user ${userId}`);
  }

  return musician;
}

type ClearableSongInstrumentStorage = {
  clear?: () => void;
};

function clearSongInstrumentStorage(): void {
  const storage = container.get<ClearableSongInstrumentStorage>('Orchestrator.SongInstrumentProcess.StorageRepository');
  storage.clear?.();
}

function authenticatedUserIdFromPayload(payload: jsonwebtoken.JwtPayload): string {
  const userId = payload.sub ?? payload.userId;

  if (typeof userId !== 'string' || userId.length === 0) {
    throw new Error('No authenticated user id found in token payload.');
  }

  return userId;
}
