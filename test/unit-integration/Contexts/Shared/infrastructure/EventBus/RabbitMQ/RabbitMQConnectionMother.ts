import { mock } from 'vitest-mock-extended';
import { RabbitMQConnection } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';
import { RabbitMQConnectionDouble } from '../../../../../../utils/mocks/RabbitMQConnectionDouble.js';
import { RabbitMQConnectionConfigurationMother } from './RabbitMQConnectionConfigurationMother.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';

export class RabbitMQConnectionMother {
  static async create() {
    const config = RabbitMQConnectionConfigurationMother.create();
    const connection = new RabbitMQConnection(config, mock<Logger>());
    await connection.connect();
    return connection;
  }

  static failOnPublish() {
    return new RabbitMQConnectionDouble(RabbitMQConnectionConfigurationMother.create(), mock<Logger>());
  }
}
