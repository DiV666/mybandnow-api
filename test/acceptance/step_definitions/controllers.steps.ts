import assert from 'assert';
import { AfterAll, Before, BeforeAll, Given, setDefaultTimeout, Then, When } from '@cucumber/cucumber';
import container from '../../apps/mybandnow/backend/config/dependency-injection/index.js';
import { EnvironmentArranger } from '../../utils/arranger/EnvironmentArranger.js';
import axios from 'axios';
import qs from 'qs';
import jsonwebtoken from 'jsonwebtoken';
import { MybandnowWorld } from './MybandnowWorld.js';
import { testKeycloakClientId, testKeycloakTokenUrl } from '../../utils/keycloak/TestKeycloak.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { waitForKeycloak } from '../utils/waitForKeycloak.js';
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

BeforeAll(async (): Promise<void> => {
  await waitForKeycloak({ origin: env.KEYCLOAK_ORIGIN });

  const keycloakEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.KeycloakEnvironmentArranger');
  await (await keycloakEnvironmentArranger).arrange();
});

Before(async (): Promise<void> => {
  const mongoEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.MongoEnvironmentArranger');
  await (await mongoEnvironmentArranger).arrange();
});

/**
 * Makes a request to the Keycloak server to obtain an access token.
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @return {Promise<string>} The access token.
 */
async function getToken(username: string, password: string): Promise<string> {
  const data = qs.stringify({
    password,
    username,
    grant_type: 'password',
    scope: 'openid',
    client_id: testKeycloakClientId()
  });
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  const response = await axios.post(testKeycloakTokenUrl(), data, { headers });
  return response.data.access_token;
}

AfterAll(async (): Promise<void> => {
  const mongoEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.MongoEnvironmentArranger');
  await (await mongoEnvironmentArranger).clean();
  await (await mongoEnvironmentArranger).close();
  const keycloakEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.KeycloakEnvironmentArranger');
  await (await keycloakEnvironmentArranger).clean();
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
