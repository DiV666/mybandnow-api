import { z } from 'zod';
import StructuredFallbackLogger from '../Logger/StructuredFallbackLogger.js';

const fallbackLogger = new StructuredFallbackLogger();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // API
  PORT: z.coerce.number().int().min(1).max(65535).default(4008),
  TIMEOUT: z.coerce.number().int().positive().default(120000),
  MAX_PAYLOAD_SIZE: z.string().default('256kb'),
  BASE_PATH: z.string().default('/api'),

  // Logger
  LOG_PATH: z.string().default('./logs'),
  LOG_FILENAME: z.string().default('mybandnow-api.log'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('debug'),
  LOG_TYPES: z
    .string()
    .default('file,console')
    .transform((val) => val.split(',').filter(Boolean)),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:4009'),
  CORS_SUCCESS_STATUS: z.coerce.number().int().default(200),

  // RabbitMQ
  RABBITMQ_USERNAME: z.string().min(1),
  RABBITMQ_PASSWORD: z.string().min(1),
  RABBITMQ_VHOST: z.string().min(1),
  RABBITMQ_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val): boolean => val === 'true'),
  RABBITMQ_HOSTNAME: z.string().min(1),
  RABBITMQ_PORT: z.coerce.number().int().min(1).max(65535),
  RABBITMQ_EXCHANGE_NAME: z.string().min(1),
  RABBITMQ_MAX_RETRIES: z.coerce.number().int().min(0),
  RABBITMQ_RETRY_TTL: z.coerce.number().int().min(0),

  // Postgres (Prisma)
  DATABASE_URL: z.string().min(1),

  // Internal Authentication (RS256 JWT)
  KLODING_INTERNAL_PUBLIC_KEY_BASE64: z.string().min(1),
  KLODING_INTERNAL_PRIVATE_KEY_BASE64: z.string().min(1),

  // Sentry (optional)
  SENTRY_DSN: z.url().optional(),

  // JWT Secret
  JWT_SECRET: z.string().min(32)
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const errors = getFieldErrors(result.error);
  fallbackLogger.error({ errors }, 'Invalid environment variables');
  throw new Error('Invalid environment variables');
}

export const env: Env = result.data;

function getFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.issues.reduce<Record<string, string[]>>((accumulator, issue) => {
    const field = issue.path[0];

    if (typeof field !== 'string') {
      return accumulator;
    }

    if (!accumulator[field]) {
      accumulator[field] = [];
    }

    accumulator[field].push(issue.message);
    return accumulator;
  }, {});
}
