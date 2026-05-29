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
        signal: AbortSignal.timeout(10000), // 10 second timeout
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

      // non 2xx response — throw so BullMQ retries
      throw new Error(`HTTP ${response.status}`);

    } catch (err: unknown) {
      const duration = Date.now() - start;
      const error = err instanceof Error ? err : new Error('Unknown error');

      // dont log delivery attempt twice for non-2xx — already logged above
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

      throw error; // rethrow so BullMQ retries
    }
  },
  {
    connection: {
      host: config.redisHost,
      port: config.redisPort,
    }
  }
);

// fires when all retries are exhausted
webhookWorker.on('failed', async (job: Job<JobPayload> | undefined, err: Error) => {
  if (!job) return;

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

    // only mark failed if not already delivered
    const eventStatus = await findEventStatusById(event_id);
    if (eventStatus && eventStatus.status === 'pending') {
      await updateEventStatus(event_id, 'failed');
    }
  }
});