import { createEndpoint,createEndpointSubscription,findByUrlAndUserId,deactivateEndpoint,findByEndpointIdAndUserId,findByEventType,removeSubscription } from "../repositories/endpoints.repository";
import { Endpoint,EndpointSubscription,CreateEndpointInput } from "../types/endpoints.types";
import crypto from 'crypto';
import pool from '../db/client';

export const registerEndpoint = async (
    input: CreateEndpointInput,
    user_id: string
    ): Promise<Endpoint> => {

    const uniqueEventTypes = new Set(input.event_types);
    if (uniqueEventTypes.size !== input.event_types.length) {
        throw new Error('Duplicate event types in request');
    }

    const existing = await findByUrlAndUserId(input.url, user_id);
    if (existing) throw new Error('Endpoint already registered');

    const secret = crypto.randomBytes(32).toString('hex');

    
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const endpoint = await createEndpoint(client, user_id, input.url, secret);

        await Promise.all(
        input.event_types.map(event_type =>
            createEndpointSubscription(endpoint.id, event_type,client)
        )
        );

        await client.query('COMMIT');
        return endpoint;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};


export const deleteEndpoint = async (
    endpoint_id: string,
    user_id: string
): Promise<Endpoint> => {
    const endpoint = await deactivateEndpoint(endpoint_id, user_id);
    
    if (!endpoint) throw new Error('Endpoint not found or unauthorized');
    
    return endpoint;
};


export const addEventType = async (
  endpointId: string,
  eventType: string,
  userId: string
): Promise<EndpointSubscription> => {

  const endpoint = await findByEndpointIdAndUserId(endpointId, userId);
  if (!endpoint) throw new Error('Endpoint not found or unauthorized');
  if (!endpoint.is_active) throw new Error('Endpoint is deactivated');

  const existing = await findByEventType(endpointId, eventType);
  if (existing) throw new Error('Event type already subscribed for this endpoint');

  return await createEndpointSubscription(endpointId, eventType);
};

export const removeEventType = async (
  endpointId: string,
  eventType: string,
    userId: string
): Promise<EndpointSubscription> => {
    const endpoint = await findByEndpointIdAndUserId(endpointId, userId);
    if (!endpoint) throw new Error('Endpoint not found or unauthorized');
    if (!endpoint.is_active) throw new Error('Endpoint is deactivated');

    const subscription = await removeSubscription(endpointId, eventType);
    if (!subscription) throw new Error('Subscription not found');

    return subscription;
};


