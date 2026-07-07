export type HealthType = 'OK' | 'KO';

export class HealthStatus {
  private rabbitHealth: HealthType;
  private mongoHealth: HealthType;
  constructor() {
    this.mongoHealth = 'OK';
    this.rabbitHealth = 'OK';
  }

  isHealth(): boolean {
    return this.mongoHealth === 'OK' && this.rabbitHealth === 'OK';
  }

  isUnhealthy(): boolean {
    return !this.isHealth();
  }

  setRabbitHealth(newStatus: HealthType) {
    this.rabbitHealth = newStatus;
  }

  setMongoHealth(newStatus: HealthType) {
    this.mongoHealth = newStatus;
  }
}

export default new HealthStatus();
