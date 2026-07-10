import assert from 'assert';
import { AfterAll, Before, Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
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

Given(
  'An authenticated user {string} with password {string}',
  async function (this: MybandnowWorld, username: string, password: string) {
    const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
    const userIdValue = uuidv5(username, NAMESPACE);
    const encryptor = container.get<PasswordEncryptor>('Mybandnow.User.PasswordEncryptor');
    const userRepository = container.get<UserPersistenceRepository>('Mybandnow.User.UserRepository');

    const hashedPassword = await encryptor.hash(password);
    const user = User.create(
      new UserId(userIdValue),
      new UserEmail(`${username}@example.com`),
      new UserPassword(hashedPassword)
    );
    await userRepository.save(user);

    const access_token = await getToken(username, password, userIdValue);
    this.setAuthToken(access_token);
  }
);

Given('they have a musician profile', async function (this: MybandnowWorld) {
  if (!this.authToken)
    throw new Error('No auth token found. Cannot create musician profile without an authenticated user.');
  const payload = jsonwebtoken.decode(this.authToken) as any;
  const username = payload.preferred_username;
  const userIdValue = payload.userId;

  const musicianRepository = container.get<MusicianRepository>('Moat.Musician.MusicianRepository');
  const musician = new Musician(
    new MusicianId(MusicianId.random()),
    new MusicianUsername(username),
    new MusicianName(username),
    new MusicianUserId(userIdValue)
  );
  await musicianRepository.save(musician);
});

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

Then('the response status code should be {int}', function (this: MybandnowWorld, status: number) {
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

Then('the response should be empty', function (this: MybandnowWorld) {
  assert.deepStrictEqual(this.response.body, {});
});
Before(async (): Promise<void> => {
  const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
  await (await prismaEnvironmentArranger).arrange();
});

/**
 * Mocks the access token generation locally since Keycloak is removed.
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @return {Promise<string>} The access token.
 */

async function getToken(username: string, _password?: string, userIdValue?: string): Promise<string> {
  const { v5: uuidv5 } = await import('uuid');
  const subId = userIdValue || uuidv5(username, '1b671a64-40d5-491e-99b0-da01ff1f3341');
  const payload = {
    sub: subId,
    userId: subId,
    email: `${username}@example.com`,
    roles: ['admin', 'user:create', 'user:read', 'user:update', 'user:delete'],
    preferred_username: username
  };

  return jsonwebtoken.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
}

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
