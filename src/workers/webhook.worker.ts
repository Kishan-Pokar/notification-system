import { Worker, Job } from 'bullmq';
import crypto from 'crypto';
import { config } from '../config/index';
import { JobPayload } from '../types/job.types';
import { createDeliveryAttempt, updateEventStatus, findEventStatusById } from '../repositories/events.repository';

const signPayload = (payload: string, secret: string): string => {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
};

export const webhookWorker = new Worker<JobPayload>(
  'webhooks',
  async (job: Job<JobPayload>) => {
    const { url, secret, payload, event_id, endpoint_id } = job.data;

    // verify event still exists before attempting delivery
    const event = await findEventStatusById(event_id);
    if (!event) {
      console.error(`Event ${event_id} no longer exists. Discarding job.`);
      return; // return without throwing — don't retry a deleted event
    }

    const body = JSON.stringify(payload);
    const signature = signPayload(body, secret);
    const start = Date.now();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      const duration = Date.now() - start;
      const responseBody = await response.text();

      await createDeliveryAttempt({
        event_id,
        endpoint_id,
        attempt_number: job.attemptsMade + 1,
        status: response.ok ? 'success' : 'failed',
        http_status_code: response.status,
        response_body: responseBody,
        error_message: null,
        duration_ms: duration,
      });

      if (response.ok) {
        await updateEventStatus(event_id, 'delivered');
        return;
      }

      throw new Error(`HTTP ${response.status}`);

    } catch (err: unknown) {
      const duration = Date.now() - start;
      const error = err instanceof Error ? err : new Error('Unknown error');

      if (!error.message.startsWith('HTTP')) {
        await createDeliveryAttempt({
          event_id,
          endpoint_id,
          attempt_number: job.attemptsMade + 1,
          status: 'failed',
          http_status_code: null,
          response_body: null,
          error_message: error.message,
          duration_ms: duration,
        });
      }

      throw error;
    }
  },
  {
    connection: {
      host: config.redisHost,
      port: config.redisPort,
    }
  }
);

webhookWorker.on('failed', async (job: Job<JobPayload> | undefined, err: Error) => {
  if (!job) return;

  try {
    if (job.attemptsMade >= (job.opts.attempts ?? 5)) {
      const { event_id, endpoint_id } = job.data;

      await createDeliveryAttempt({
        event_id,
        endpoint_id,
        attempt_number: job.attemptsMade,
        status: 'exhausted',
        http_status_code: null,
        response_body: null,
        error_message: err.message,
        duration_ms: null,
      });

      const eventStatus = await findEventStatusById(event_id);
      if (eventStatus && eventStatus.status === 'pending') {
        await updateEventStatus(event_id, 'failed');
      }
    }
  } catch (handlerError) {
    console.error('Worker failed handler error:', handlerError);
  }
});

webhookWorker.on('error', (err) => {
  console.error('Worker error:', err.message);
});