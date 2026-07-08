import assert from 'assert';
import { AfterAll, Before, Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import container from '../../apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '../../utils/arranger/EnvironmentArranger.js';
import { MybandnowWorld } from './MybandnowWorld.js';
import jsonwebtoken from 'jsonwebtoken';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { UuidMother } from '../../unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';

setDefaultTimeout(20000);

Given(
  'An authenticated user {string} with password {string}',
  async function (this: MybandnowWorld, username: string, password: string) {
    const access_token = await getToken(username, password);
    this.setAuthToken(access_token);
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
    email: `${username}@example.com`,
    realm_access: {
      roles: ['admin', 'user:create', 'user:read', 'user:update', 'user:delete']
    },
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
