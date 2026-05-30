import pool from '../db/client';
import { webhookQueue } from '../queues/webhook.queue';
import { webhookWorker } from '../workers/webhook.worker';

export default async function teardown() {
  await webhookWorker.close();
  await webhookQueue.close();
  await pool.end();
}