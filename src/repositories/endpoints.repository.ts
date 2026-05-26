import pool from '../db/client';
import { QueryResult } from 'pg';
import { Endpoint,EndpointSubscription } from '../types/endpoints.types'

export const createEndpoint = async (
    user_id: string,
    url: string,
    secret: string
): Promise<Endpoint> => {
  const result: QueryResult<Endpoint> = await pool.query(
    `INSERT INTO endpoints (user_id, url, secret)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, url, secret, is_active, created_at`,
    [user_id,url,secret]
  );

  return result.rows[0];
};

export const createEndpointSubscription = async (
    endpoint_id: string,
    event_type: string
): Promise<EndpointSubscription> => {
    const result: QueryResult<EndpointSubscription> = await pool.query(
    `INSERT INTO endpoint_subscriptions (endpoint_id, event_type)
     VALUES ($1, $2)
     RETURNING id, endpoint_id, event_type, created_at`,
    [endpoint_id,event_type]
  );

  return result.rows[0];
}

export const findByUrlAndUserId = async (
  url: string,
  userId: string
): Promise<Endpoint | null> => {
  const result = await pool.query(
    `SELECT * FROM endpoints 
     WHERE url = $1 
     AND user_id = $2
     AND is_active = true`,
    [url, userId]
  );
  return result.rows[0] || null;
};

export const deactivateEndpoint = async (
  id: string,
  userId: string
): Promise<Endpoint | null> => {
  const result = await pool.query(
    `UPDATE endpoints 
     SET is_active = false 
     WHERE id = $1 
     AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
  return result.rows[0] || null;
};