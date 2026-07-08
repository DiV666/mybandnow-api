export type HealthType = 'OK' | 'KO';

export class HealthStatus {
  private rabbitHealth: HealthType;
  private prismaHealth: HealthType;
  constructor() {
    this.prismaHealth = 'OK';
    this.rabbitHealth = 'OK';
  }

  isHealth(): boolean {
    return this.prismaHealth === 'OK' && this.rabbitHealth === 'OK';
  }

  isUnhealthy(): boolean {
    return !this.isHealth();
  }

  setRabbitHealth(newStatus: HealthType) {
    this.rabbitHealth = newStatus;
  }

  setPrismaHealth(newStatus: HealthType) {
    this.prismaHealth = newStatus;
  }
}

export default new HealthStatus();
