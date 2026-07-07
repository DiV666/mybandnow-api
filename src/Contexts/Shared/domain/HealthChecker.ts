/**
 * Health status checker interface - allows Apps layer to check service health
 * without depending on Infrastructure layer implementation
 */
export interface HealthChecker {
  isUnhealthy(): boolean;
}
