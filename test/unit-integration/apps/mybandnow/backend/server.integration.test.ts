import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mock } from 'vitest-mock-extended';
import supertest from 'supertest';
import { Server } from '../../../../../src/apps/mybandnow/backend/server.js';
import type { Logger } from '../../../../../src/Contexts/Shared/application/index.js';
import healthStatus from '../../../../../src/Contexts/Shared/infrastructure/health.js';

describe('Server — health endpoints', () => {
  let server: Server;
  let request: ReturnType<typeof supertest>;

  beforeAll(async () => {
    // Arrange — start server on a random available port
    const logger = mock<Logger>();
    server = new Server(0, logger, healthStatus); // port 0 → OS assigns a free port
    await server.listen();
    if (!server.httpServer) {
      throw new Error('Server httpServer is undefined after listen()');
    }
    request = supertest(server.httpServer);
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('GET /v1/startup', () => {
    it('returns 200 with startup OK', async () => {
      const res = await request.get('/v1/startup');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ startup: 'OK' });
    });
  });

  describe('GET /v1/readiness', () => {
    it('returns 200 when all dependencies are healthy', async () => {
      // Arrange — ensure health is OK
      healthStatus.setMongoHealth('OK');
      healthStatus.setRabbitHealth('OK');

      const res = await request.get('/v1/readiness');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ readiness: 'OK' });
    });

    it('returns 503 when any dependency is unhealthy', async () => {
      // Arrange
      healthStatus.setMongoHealth('KO');

      const res = await request.get('/v1/readiness');
      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ readiness: 'KO' });

      // Cleanup
      healthStatus.setMongoHealth('OK');
    });
  });

  describe('GET /v1/liveness', () => {
    it('returns 200 with liveness OK', async () => {
      const res = await request.get('/v1/liveness');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ liveness: 'OK' });
    });
  });
});
