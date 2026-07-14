import express, { type Request as ExpressRequest, Response } from 'express';
import type { Request } from 'openapi-backend';
import { createRequire } from 'node:module';
import * as http from 'http';

// TypeScript 6.0 + ts-node/esm workaround: use createRequire for hybrid CJS/ESM packages
const require = createRequire(import.meta.url);

const helmet = require('helmet') as typeof import('helmet').default;

import config from './config/config.js';

import { OpenAPIBackend } from 'openapi-backend';
import addFormats from 'ajv-formats';
import apiDefinition from './config/swagger/definition.json' with { type: 'json' };
import type { Logger, HealthChecker, JWTVerifier } from '@Contexts/Shared/application/index.js';
import cors from 'cors';
import {
  traceReqAndRes,
  correlationIdHeader,
  continuationLocalStorage,
  exceptionHandler
} from './middlewares/index.js';
import { routes } from './routes/index.js';
import { createDefaultHandlers } from './routes/openapiBackendRoute.js';
import { createSecurityHandler } from './routes/openapiSecurity.js';
import container from './config/dependency-injection/index.js';

function ensureMultipartOpenApiBody(req: ExpressRequest): void {
  const contentType = req.headers['content-type'];
  if (typeof contentType !== 'string' || !contentType.startsWith('multipart/form-data')) {
    return;
  }

  if (req.body !== undefined) {
    return;
  }

  req.body = { video: 'multipart-upload' };
}

export class Server {
  private readonly API_CONFIG = config.api;
  readonly port: number;
  private readonly express: express.Express;
  httpServer?: http.Server;

  constructor(
    port: number,
    readonly logger: Logger,
    private readonly healthChecker: HealthChecker
  ) {
    this.port = port;
    this.express = express();
    this.express.use(cors(config.cors));
    this.express.use(express.json({ limit: this.API_CONFIG.maxPayloadSize }));
    this.express.use(express.urlencoded({ extended: false, limit: this.API_CONFIG.maxPayloadSize }));
    // Helmet with explicit CSP for XSS protection
    this.express.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:']
          }
        }
      })
    );

    this.express.use(continuationLocalStorage);
    this.express.use(traceReqAndRes);
    this.express.use(correlationIdHeader);

    this.express.use('/tools/docs', express.static('docs'));
    this.express.use(`/v1/startup`, this.startup.bind(this));
    this.express.use(`/v1/readiness`, this.readiness.bind(this));
    this.express.use(`/v1/liveness`, this.liveness.bind(this));
  }

  async listen(): Promise<void> {
    await this.oastools();
    return new Promise((resolve, reject) => {
      this.httpServer = this.express.listen(this.port, () => {
        this.logger.info(`Listening on port ${this.port}`);
        this.logger.info('  Press CTRL-C to stop');
        resolve();
      });
      this.httpServer.once('error', reject);
      this.httpServer.timeout = this.API_CONFIG.timeout;
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.httpServer) {
        this.httpServer.close((error) => {
          if (error) {
            // ERR_SERVER_NOT_RUNNING means the server already stopped — treat as success
            const errno = error as NodeJS.ErrnoException;
            if (errno && errno.code === 'ERR_SERVER_NOT_RUNNING') {
              return resolve();
            }
            return reject(error);
          }
          return resolve();
        });
      } else {
        return resolve();
      }
    });
  }

  async oastools(): Promise<void> {
    const api = new OpenAPIBackend({
      // Type cast required: openapi-backend expects a different type for definition
      definition: apiDefinition as never,
      handlers: createDefaultHandlers(this.logger),
      securityHandlers: {
        BearerAuth: createSecurityHandler('BearerAuth', async (token, c) => {
          const localJwtVerifier: JWTVerifier = container.get('Mybandnow.Shared.LocalJwtBearerToken');
          const requiredScopes =
            (c.operation?.security ?? []).find((requirement) => requirement.BearerAuth)?.BearerAuth ?? [];
          return await localJwtVerifier.verifyJWT(token, requiredScopes);
        }),
        InternalAuth: createSecurityHandler('InternalAuth', async (token) => {
          const internalAuthentication: JWTVerifier = container.get('Mybandnow.Shared.InternalAuthentication');
          return await internalAuthentication.verifyJWT(token, []);
        })
      },
      strict: true,
      validate: true,
      customizeAjv: (ajv) => {
        addFormats.default(ajv, {
          mode: 'fast',
          formats: ['uuid', 'email', 'date-time']
        });

        return ajv;
      }
    });
    api.register(routes);
    await api.init();

    // Type cast required: openapi-backend Request type differs from Express Request
    this.express.use((req, _res, next) => {
      ensureMultipartOpenApiBody(req);
      next();
    });
    this.express.use((req, res, next) => api.handleRequest(req as Request, req, res, next));
    this.express.use(exceptionHandler);
  }

  private startup(_req: ExpressRequest, res: Response): void {
    res.json({ startup: 'OK' });
  }

  private readiness(_req: ExpressRequest, res: Response): void {
    if (this.healthChecker.isUnhealthy()) {
      res.status(503).json({ readiness: 'KO', reason: 'Dependencies unavailable' });
      return;
    }
    res.json({ readiness: 'OK' });
  }

  private liveness(_req: ExpressRequest, res: Response): void {
    res.json({ liveness: 'OK' });
  }
}
