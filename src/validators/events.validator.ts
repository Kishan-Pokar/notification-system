import { z } from 'zod';

export const triggerEventSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  payload: z.record(z.string(), z.unknown()),
});