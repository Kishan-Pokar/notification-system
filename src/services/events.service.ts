import { createEvent, findByUserIdAndEventType } from '../repositories/events.repository';
import { Event } from '../types/events.types';
import { webhookQueue } from '../queues/webhook.queue';
import { JobPayload } from '../types/job.types';

export const triggerEvent = async (
  user_id: string,
  event_type: string,
  payload: Record<string, unknown>
): Promise<Event> => {

  const targetEndpoints = await findByUserIdAndEventType(user_id, event_type);
  if (targetEndpoints.length === 0) {
    throw new Error('No active endpoints subscribed to this event type');
  }

  const event = await createEvent(user_id, event_type, payload);

  await Promise.all(
    targetEndpoints.map((endpoint) => {
      const jobPayload: JobPayload = {
        url: endpoint.url,
        secret: endpoint.secret,
        payload,
        event_id: event.id,
        endpoint_id: endpoint.id,
      };

      return webhookQueue.add('deliver', jobPayload);
    })
  );

  return event;
};