import bunyan, { LogLevelString } from 'bunyan';
import fs from 'fs';
import path from 'path';

import {
  createSensitiveFieldsPolicy,
  sanitizeStringForLogging,
  sanitizeValueForLogging
} from '../../domain/LoggingRedactionPolicy.js';
import ContinuationLocalStorage from '../Sessions/ContinuationLocalStorage.js';
import Logger from '../../domain/Logger.js';
import { sanitizeErrorForLogging } from './StructuredFallbackLogger.js';

const NAME = 'mybandnow-api';

export interface LoggerConfig {
  types?: string[];
  level: LogLevelString;
  path?: string;
  fileName?: string;
  /** Additional field names to redact (case-insensitive). Merged with built-in defaults. */
  sensitiveFields?: string[];
}

export interface LoggerConsoleStream {
  stream: NodeJS.WriteStream;
  level: LogLevelString;
}

export interface LoggerFileStream {
  type: string;
  path: string;
  period: string;
  count: number;
  level: LogLevelString;
}

class BunyanLogger implements Logger {
  private bunyanLogger: bunyan;
  private readonly sensitiveFields: ReadonlySet<string>;

  constructor(private loggerConfig: LoggerConfig) {
    this.sensitiveFields = createSensitiveFieldsPolicy(loggerConfig.sensitiveFields ?? []);
    // If config.types is not present the logger will be console + file by default
    // so we have to ensure that log file exists
    if (
      this.loggerConfig.path &&
      (!this.loggerConfig.types || !Array.isArray(this.loggerConfig.types) || this.loggerConfig.types.includes('file'))
    ) {
      // ensure that log path exists
      if (!fs.existsSync(this.loggerConfig.path)) {
        fs.mkdirSync(this.loggerConfig.path, {
          recursive: true
        });
      }
    }

    const serializers = { ...bunyan.stdSerializers, res: this.responseSerializer.bind(this) };

    const streams = this.getLoggerStreams(this.loggerConfig, NAME);

    this.bunyanLogger = bunyan.createLogger({
      name: NAME,
      src: false,
      serializers: serializers,
      streams: streams
    });
  }

  error(obj: unknown, ...args: string[]): void {
    this.wrapper(this.bunyanLogger.error.bind(this.bunyanLogger), obj, ...args);
  }

  warn(obj: unknown, ...args: string[]): void {
    this.wrapper(this.bunyanLogger.warn.bind(this.bunyanLogger), obj, ...args);
  }

  info(obj: unknown, ...args: string[]): void {
    this.wrapper(this.bunyanLogger.info.bind(this.bunyanLogger), obj, ...args);
  }

  debug(obj: unknown, ...args: string[]): void {
    this.wrapper(this.bunyanLogger.debug.bind(this.bunyanLogger), obj, ...args);
  }

  /**
   * Custom response serializer function.
   * @param {Object} res - res to serialize
   */
  private responseSerializer(res: Record<string, unknown>): Record<string, unknown> {
    /**
     * Calculates the elapsed time (in milliseconds) have elapsed from the timestamp received by parameter.
     * @param {number} start - start timestamp
     * @returns {number} elapsed time
     */
    function getDuration(start: number): number {
      const now = Date.now();
      return now - start;
    }

    if (!res || !res.statusCode) {
      return res;
    }

    const obj: Record<string, unknown> = {
      statusCode: res.statusCode
    };

    const ctx = ContinuationLocalStorage.getContext();
    if (ctx) {
      obj.duration = getDuration(ctx.requestTime);
    }

    return obj;
  }

  /**
   * Returns the logger streams based in config.types property.
   * @param {Object} loggerConfig - the logger config
   * @param {Object} name - the logger name
   * @returns {Object} the logger logger streams
   */
  private getLoggerStreams(loggerConfig: LoggerConfig, name: string): (LoggerConsoleStream | LoggerFileStream)[] {
    const consoleStreamConfig: LoggerConsoleStream = {
      stream: process.stdout, // log INFO and above to stdout
      level: loggerConfig.level
    };

    let logPath;
    if (loggerConfig.path && loggerConfig.fileName) {
      logPath = path.join(loggerConfig.path, loggerConfig.fileName);
    } else {
      logPath = `/tmp/${name}.log`;
    }
    const fileStreamConfig: LoggerFileStream = {
      type: 'rotating-file',
      path: logPath,
      period: '1d', // daily rotation
      count: 30, // keep 30 back copies
      level: loggerConfig.level
    };

    // If types is not present, types is not an array or is an empty array --> console stream + file stream
    if (!loggerConfig.types || !Array.isArray(loggerConfig.types) || loggerConfig.types.length === 0) {
      return [consoleStreamConfig, fileStreamConfig];
    }

    const streams = [];
    if (loggerConfig.types.includes('console')) {
      streams.push(consoleStreamConfig);
    }

    if (loggerConfig.types.includes('file')) {
      streams.push(fileStreamConfig);
    }

    return streams;
  }

  /**
   * Do a wrapper between the bunyan logger and the returned logger.
   * @param {*} fn function to be wrapped
   * @param {*} obj object to be logged
   * @param  {...Array<any>} params other data to be included in the log
   */
  private wrapper(fn: (...args: unknown[]) => void, obj: unknown, ...params: unknown[]): void {
    let objResult: Record<string, unknown> = {};
    const sanitizedParams = params.map((param) => this.sanitizeParam(param));

    if (sanitizedParams.length === 0) {
      if (obj instanceof Error) {
        objResult = { err: sanitizeErrorForLogging(obj) };
      } else if (obj === null || typeof obj !== 'object') {
        sanitizedParams.push(sanitizeStringForLogging(String(obj)));
      } else {
        sanitizedParams.push(this.sanitizeStructuredObject(obj as Record<string, unknown>));
      }
    } else {
      if (obj instanceof Error) {
        objResult = { err: sanitizeErrorForLogging(obj) };
      } else if (obj === null || typeof obj !== 'object') {
        objResult.object = { message: sanitizeStringForLogging(String(obj)) };
      } else {
        const record = obj as Record<string, unknown>;
        if (record.req || record.res) {
          objResult = this.sanitizeStructuredObject(record);
        } else {
          objResult.object = this.sanitizeStructuredObject(record);
        }
      }
    }

    const ctx = ContinuationLocalStorage.getContext();
    if (ctx) {
      objResult.req_id = ctx.correlationId;
    }
    fn(objResult, ...sanitizedParams);
  }

  private sanitizeParam(param: unknown): unknown {
    if (typeof param === 'string') {
      return sanitizeStringForLogging(param);
    }

    if (param !== null && typeof param === 'object') {
      return sanitizeValueForLogging(param, this.sensitiveFields, 0, new WeakSet<object>(), sanitizeErrorForLogging);
    }

    return param;
  }

  private sanitizeStructuredObject(obj: Record<string, unknown>): Record<string, unknown> {
    return sanitizeValueForLogging(
      obj,
      this.sensitiveFields,
      0,
      new WeakSet<object>(),
      sanitizeErrorForLogging
    ) as Record<string, unknown>;
  }
}

export default BunyanLogger;
