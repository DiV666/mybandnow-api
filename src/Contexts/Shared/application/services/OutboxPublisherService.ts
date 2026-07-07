export interface OutboxPublisherService {
  start(): void;
  stop(): Promise<void>;
}
