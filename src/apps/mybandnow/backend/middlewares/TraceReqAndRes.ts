import { Request, Response, NextFunction } from 'express';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Middleware } from './Middleware.js';

const SENSITIVE_RESPONSE_HEADERS = new Set(['set-cookie', 'authorization', 'cookie']);

export default class TraceReqAndRes implements Middleware {
  constructor(private readonly logger: Logger) {}

  async run(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (this.isNotHealthPaths(req.url)) {
      const startTime = process.hrtime();
      this.logger.info(`Requested method-url pair: ${req.method} - ${this.sanitizeUrlForLogging(req.url)}`);

      res.on('finish', (): void => {
        const duration = this.getDuration(startTime);

        const { statusCode, statusMessage } = res;
        const safeHeaders = Object.fromEntries(
          Object.entries(res.getHeaders()).filter(([key]) => !SENSITIVE_RESPONSE_HEADERS.has(key.toLowerCase()))
        );
        const resInfo = {
          duration: Math.round(duration),
          headers: safeHeaders,
          statusCode,
          statusMessage
        };

        this.logger.info(resInfo, 'Response to send:');
      });
    }

    next();
  }

  private sanitizeUrlForLogging(url: string): string {
    // Query strings may contain PII (search filter values, etc.) — log the path and redact the query
    const [path, query] = url.split('?');
    return query ? `${path}?redacted` : path;
  }

  private getDuration(startTime: [number, number]): number {
    const [seconds, nanoseconds] = process.hrtime(startTime);
    return (seconds * 1e9 + nanoseconds) / 1e6;
  }

  private isNotHealthPaths(path: string): boolean {
    const healthPaths = ['/v1/readiness', '/v1/liveness', '/v1/startup'];
    return !healthPaths.includes(path);
  }
}
