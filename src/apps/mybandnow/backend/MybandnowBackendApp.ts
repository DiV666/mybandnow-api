import container from './config/dependency-injection/index.js';
import * as Sentry from '@sentry/node';
import { Server } from './server.js';
import type {
  Logger,
  EventBus,
  AppBootstrapService,
  OutboxPublisherService,
  Outbox
} from '@Contexts/Shared/application/index.js';
import config from './config/config.js';
import { sanitizeRuntimeErrorForTelemetry } from './runtime/runtimeLogging.js';

export class MybandnowBackendApp {
  private readonly API_CONFIG = config.api;
  private isSentryInitialized = false;
  private server?: Server;
  private readonly eventBus: EventBus = container.get<EventBus>('Shared.EventBus');
  private readonly outboxPublisher: OutboxPublisherService =
    container.get<OutboxPublisherService>('Shared.OutboxPublisher');
  private readonly outbox: Outbox = container.get<Outbox>('Shared.Outbox');
  readonly logger: Logger = container.get('Shared.BunyanLogger');
  private readonly bootstrapService: AppBootstrapService = container.get('Shared.AppBootstrapService');

  async start() {
    this.server = new Server(this.API_CONFIG.defaultPort, this.logger, this.bootstrapService.getHealthChecker());
    this.sentry();
    await this.startEventBus();
    try {
      return await this.server.listen();
    } catch (error) {
      await this.stopEventBus();
      throw error;
    }
  }

  async stop() {
    await this.server?.stop();
    await this.stopEventBus();
  }

  get port(): number {
    if (!this.server) {
      throw new Error('Mybandnow backend application has not been started');
    }
    return this.server.port;
  }

  get httpServer() {
    return this.server?.httpServer;
  }

  sentry() {
    const sentryConfig = this.bootstrapService.getSentryConfig();
    if (sentryConfig) {
      Sentry.init({
        dsn: sentryConfig.dsn,
        environment: sentryConfig.environment,
        release: sentryConfig.release,
        tracesSampleRate: 1.0
      });
      this.isSentryInitialized = true;
    }
  }

  captureException(error: unknown): void {
    if (!this.isSentryInitialized) {
      return;
    }

    Sentry.captureException(this.sanitizeErrorForTelemetry(error));
  }

  async flushTelemetry(timeoutMs = 1000): Promise<void> {
    if (!this.isSentryInitialized) {
      return;
    }

    await Sentry.flush(timeoutMs);
  }

  private async startEventBus() {
    // Create the outbox indexes before the poller starts querying the collection
    await this.outbox.initialize();

    await this.eventBus.start();

    this.logger.info(`Connected to EventBus <${this.eventBus.constructor.name}>`);

    // Start OutboxPublisher background poller
    this.outboxPublisher.start();
  }

  private async stopEventBus() {
    // Stop OutboxPublisher first and wait for any in-flight batch to finish
    await this.outboxPublisher.stop();

    await this.eventBus.stop();

    this.logger.info(`EventBus <${this.eventBus.constructor.name}> stopped ...`);
  }

  private sanitizeErrorForTelemetry(error: unknown): Error {
    return sanitizeRuntimeErrorForTelemetry(error);
  }
}
