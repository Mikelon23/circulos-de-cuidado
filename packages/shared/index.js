export const APP_ENVIRONMENTS = ['development', 'staging', 'production'];

export function createHealthCheck(service) {
  return {
    status: 'ok',
    service,
  };
}
