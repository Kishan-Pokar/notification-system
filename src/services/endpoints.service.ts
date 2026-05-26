import { createEndpoint,createEndpointSubscription,findByUrlAndUserId,deactivateEndpoint } from "../repositories/endpoints.repository";
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
            createEndpointSubscription(client, endpoint.id, event_type)
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



