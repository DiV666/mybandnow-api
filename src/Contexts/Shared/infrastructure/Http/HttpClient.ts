import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig
} from 'axios';
import Logger from '../../domain/Logger.js';
import { sanitizeStringForLogging } from '../../domain/LoggingRedactionPolicy.js';
import ContinuationLocalStorage from '../Sessions/ContinuationLocalStorage.js';

export interface HttpClientRequestLogContext {
  integration?: string;
  operation?: string;
  resourceId?: string;
}

interface HttpClientRequestMetadata {
  correlationId?: string;
  startedAt: number;
}

export interface HttpClientRequestConfig extends AxiosRequestConfig {
  logContext?: HttpClientRequestLogContext;
}

interface CorrelationIdHeaders {
  set(headerName: string, value: string): unknown;
}

interface HttpClientInternalRequestConfig extends InternalAxiosRequestConfig {
  logContext?: HttpClientRequestLogContext;
  metadata?: HttpClientRequestMetadata;
}

export class HttpClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(
    private logger: Logger,
    baseURL: string | null = null,
    private readonly defaultLogContext?: HttpClientRequestLogContext
  ) {
    this.axiosInstance = axios.create({
      baseURL: baseURL ?? undefined,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.initializeInterceptors();
  }

  private initializeInterceptors(): void {
    this.axiosInstance.interceptors.request.use(this.handleRequest, this.handleRequestError);

    this.axiosInstance.interceptors.response.use(
      this.handleResponse as unknown as (value: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
      this.handleResponseError
    );
  }

  private handleRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const requestConfig = config as HttpClientInternalRequestConfig;
    const correlationId = this.correlationId();

    requestConfig.metadata = {
      correlationId,
      startedAt: Date.now()
    };

    this.setCorrelationIdHeader(config.headers, correlationId);
    this.logger.info(this.requestLogPayload(requestConfig), this.logMessage('started', requestConfig));

    return requestConfig;
  };

  private handleRequestError = (error: AxiosError): Promise<AxiosError> => {
    this.logger.error(
      this.errorLogPayload(error),
      this.logMessage('setup failed', error.config as HttpClientInternalRequestConfig | undefined)
    );
    return Promise.reject(error);
  };

  private readonly handleResponse = (response: AxiosResponse): unknown => {
    this.logger.info(
      this.responseLogPayload(response),
      this.logMessage('completed', response.config as HttpClientInternalRequestConfig)
    );
    return response.data;
  };

  private handleResponseError = (error: AxiosError): Promise<AxiosError> => {
    this.logger.error(
      this.errorLogPayload(error),
      this.logMessage('failed', error.config as HttpClientInternalRequestConfig | undefined)
    );
    return Promise.reject(error);
  };

  public get<T>(url: string, config?: HttpClientRequestConfig): Promise<T> {
    return this.axiosInstance.get<T>(url, config) as Promise<T>;
  }

  public post<T>(url: string, data?: unknown, config?: HttpClientRequestConfig): Promise<T> {
    return this.axiosInstance.post<T>(url, data, config) as Promise<T>;
  }

  public put<T>(url: string, data?: unknown, config?: HttpClientRequestConfig): Promise<T> {
    return this.axiosInstance.put<T>(url, data, config) as Promise<T>;
  }

  public delete<T>(url: string, config?: HttpClientRequestConfig): Promise<T> {
    return this.axiosInstance.delete<T>(url, config) as Promise<T>;
  }

  private setCorrelationIdHeader(headers: CorrelationIdHeaders, correlationId?: string): void {
    if (correlationId) {
      headers.set('x-correlation-id', correlationId);
    }
  }

  private requestLogPayload(config: HttpClientInternalRequestConfig): Record<string, unknown> {
    return {
      ...this.baseLogPayload(config),
      correlationId: this.correlationIdFrom(config),
      url: this.sanitizeUrlForLogging(config.url)
    };
  }

  private responseLogPayload(response: AxiosResponse): Record<string, unknown> {
    const config = response.config as HttpClientInternalRequestConfig;

    return {
      ...this.baseLogPayload(config),
      correlationId: this.correlationIdFrom(config),
      durationInMs: this.durationFrom(config),
      statusCode: response.status,
      url: this.sanitizeUrlForLogging(config.url)
    };
  }

  private errorLogPayload(error: AxiosError): Record<string, unknown> {
    const config = error.config as HttpClientInternalRequestConfig | undefined;

    return {
      ...this.baseLogPayload(config),
      correlationId: this.correlationIdFrom(config),
      durationInMs: this.durationFrom(config),
      errorCode: error.code,
      errorMessage: sanitizeStringForLogging(error.message),
      errorName: error.name,
      statusCode: error.response?.status,
      url: this.sanitizeUrlForLogging(config?.url)
    };
  }

  private sanitizeUrlForLogging(url?: string): string | undefined {
    if (url === undefined) {
      return undefined;
    }

    try {
      const parsedUrl = new URL(url, 'https://sanitized.local');
      const sanitizedPath = `${parsedUrl.pathname}${parsedUrl.search ? '?redacted' : ''}`;

      if (this.isAbsoluteUrl(url)) {
        return `${parsedUrl.origin}${sanitizedPath}`;
      }

      return sanitizedPath;
    } catch {
      return this.stripUrlFragmentAndQuery(url);
    }
  }

  private isAbsoluteUrl(url: string): boolean {
    return /^[a-z][a-z\d+.-]*:\/\//iu.test(url);
  }

  private stripUrlFragmentAndQuery(url: string): string {
    const fragmentlessUrl = url.split('#', 1)[0] ?? url;
    const path = fragmentlessUrl.split('?', 1)[0] ?? fragmentlessUrl;

    return path;
  }

  private baseLogPayload(config?: HttpClientInternalRequestConfig): Record<string, unknown> {
    const mergedContext = {
      ...this.defaultLogContext,
      ...config?.logContext
    };

    return {
      integration: mergedContext.integration,
      method: config?.method?.toUpperCase(),
      operation: mergedContext.operation,
      resourceId: mergedContext.resourceId
    };
  }

  private logMessage(
    action: 'started' | 'completed' | 'failed' | 'setup failed',
    config?: HttpClientInternalRequestConfig
  ): string {
    const integration = config?.logContext?.integration ?? this.defaultLogContext?.integration;

    if (!integration) {
      return `Outbound HTTP request ${action}`;
    }

    return `Outbound HTTP request to <${integration}> ${action}`;
  }

  private durationFrom(config?: HttpClientInternalRequestConfig): number | undefined {
    const startedAt = config?.metadata?.startedAt;

    if (startedAt === undefined) {
      return undefined;
    }

    return Date.now() - startedAt;
  }

  private correlationId(): string | undefined {
    return ContinuationLocalStorage.getContext()?.correlationId;
  }

  private correlationIdFrom(config?: HttpClientInternalRequestConfig): string | undefined {
    return config?.metadata?.correlationId ?? this.correlationId();
  }
}
