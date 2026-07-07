import { env } from '@Contexts/Shared/infrastructure/config/env.js';

const config = {
  api: {
    defaultPort: env.PORT,
    timeout: env.TIMEOUT,
    maxPayloadSize: env.MAX_PAYLOAD_SIZE,
    basePath: env.BASE_PATH
  },
  logger: {
    path: env.LOG_PATH,
    fileName: env.LOG_FILENAME,
    level: env.LOG_LEVEL,
    types: env.LOG_TYPES
  },
  cors: {
    origin: env.CORS_ORIGIN,
    optionsSuccessStatus: env.CORS_SUCCESS_STATUS
  }
};

export type Config = typeof config;
export default config;
