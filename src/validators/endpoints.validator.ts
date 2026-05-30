import { z } from 'zod';

export const createEndpointSchema = z.object({
  url: z.url('Invalid URL'),
  event_types: z.array(z.string().min(1)).min(1, 'At least one event type required'),
});

export const addEventTypeSchema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
});