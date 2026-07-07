export class RabbitMQConnectionConfigurationMother {
  static create() {
    return {
      connectionSettings: {
        username: process.env.RABBITMQ_USERNAME as string,
        password: process.env.RABBITMQ_PASSWORD as string,
        vhost: process.env.RABBITMQ_VHOST as string,
        connection: {
          secure: (process.env.RABBITMQ_SECURE as string) === 'true' ? true : false,
          hostname: process.env.RABBITMQ_HOSTNAME as string,
          port: parseInt(process.env.RABBITMQ_PORT as string)
        }
      },
      exchangeSettings: {
        name: process.env.RABBITMQ_EXCHANGE_NAME as string
      },
      maxRetries: parseInt(process.env.RABBITMQ_MAX_RETRIES as string), // 3
      retryTtl: parseInt(process.env.RABBITMQ_RETRY_TTL as string) // 1000
    };
  }
}
