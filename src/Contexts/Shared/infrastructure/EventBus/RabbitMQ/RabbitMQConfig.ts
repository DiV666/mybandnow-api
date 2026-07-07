import { ConnectionSettings } from './ConnectionSettings.js';
import { ExchangeSetting } from './ExchangeSetting.js';

export type RabbitMQConfig = {
  connectionSettings: ConnectionSettings;
  exchangeSettings: ExchangeSetting;
  maxRetries: number;
  retryTtl: number;
};
