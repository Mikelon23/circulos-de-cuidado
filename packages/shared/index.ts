export type AppEnvironment = 'development' | 'staging' | 'production';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
}

export function createHealthCheck(service: string): HealthCheckResponse {
  return {
    status: 'ok',
    service,
  };
}
