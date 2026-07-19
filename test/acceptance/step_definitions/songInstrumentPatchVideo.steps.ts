import { When } from '@cucumber/cucumber';
import { MybandnowWorld } from './MybandnowWorld.js';

When(
  'I send a PATCH request to {string} with body:',
  async function (this: MybandnowWorld, route: string, body: string) {
    const resolvedRoute = this.dataUtil.replaceTokensWithCustomOrFakerValues(route) as string;
    const data = this.dataUtil.replaceTokensWithCustomOrFakerValues(parseRequestBody(body)) as Record<string, unknown>;
    const req = this.request.patch(resolvedRoute).send(data);
    attachAuthHeader(this, req);
    this.response = await req;
  }
);

function parseRequestBody(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`Invalid PATCH request body JSON: ${(error as Error).message}`);
  }
}

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
