import { metricsRepository } from './metrics.repository';

export const metricsService = {
  getGlobalMetrics: () => metricsRepository.getGlobalMetrics()
};
