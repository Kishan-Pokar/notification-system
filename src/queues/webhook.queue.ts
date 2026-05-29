import { Queue } from 'bullmq';
import { config } from '../config/index';

export const webhookQueue = new Queue('webhooks', {
  connection: {
    host: config.redisHost,
    port: config.redisPort,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  }
});

webhookQueue.on('error', (err) => {
  console.error('Queue error:', err.message);
});