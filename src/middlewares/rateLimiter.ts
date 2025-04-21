import { logger } from '@/utils/logger';
import Bottleneck from 'bottleneck';
import os from 'os';

const cpuCount = os.cpus().length;

const limiter = new Bottleneck({
  maxConcurrent: Math.max(cpuCount - 1, 1),
  minTime: 100,
  reservoir: 600,
  reservoirRefreshInterval: 60 * 1000,
  reservoirRefreshAmount: 600,
  highWater: 1000,
  strategy: Bottleneck.strategy.LEAK,
});

limiter.on('error', err => logger.error('Limiter error:', err));

export const rateLimit = (): Promise<void> => {
  return limiter.schedule({ expiration: 5000 }, () => Promise.resolve());
};
