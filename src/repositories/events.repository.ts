import pool from '../db/client';
import { QueryResult } from 'pg';
import { Event,DeliveryAttempt,CreateDeliveryAttemptInput,WebhookTarget,EventWithStats } from '../types/events.types'

export const createEvent = async (
    user_id: string,
    event_type: string,
    payload: Record<string, unknown>
): Promise<Event> => {
    const result: QueryResult<Event> = await pool.query(
        `INSERT INTO events (user_id, event_type, payload)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, event_type, payload, status, created_at`,
        [user_id, event_type, payload]
    );
    return result.rows[0];
};



export const createDeliveryAttempt = async (
  input: CreateDeliveryAttemptInput
): Promise<DeliveryAttempt> => {
  const result: QueryResult<DeliveryAttempt> = await pool.query(
    `INSERT INTO delivery_attempts 
     (event_id, endpoint_id, attempt_number, status, http_status_code, response_body, error_message, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.event_id,
      input.endpoint_id,
      input.attempt_number,
      input.status,
      input.http_status_code,
      input.response_body,
      input.error_message,
      input.duration_ms
    ]
  );
  return result.rows[0];
};

export const updateEventStatus = async (
    eventId: string,
    status: 'pending' | 'delivered' | 'failed'
): Promise<Event | null> => {
    const result: QueryResult<Event> = await pool.query(
        `UPDATE events
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, eventId]
    );
    return result.rows[0] || null;
};



export const findByUserIdAndEventType = async (
    userId: string,
    eventType: string
): Promise<WebhookTarget[]> => {
    const result: QueryResult<WebhookTarget> = await pool.query(
        `SELECT e.id, e.url, e.secret 
        FROM endpoints e
        JOIN endpoint_subscriptions es ON e.id = es.endpoint_id
        WHERE e.user_id = $1 
        AND es.event_type = $2
        AND e.is_active = true`,
        [userId, eventType]
    );
    return result.rows;
};


export const findEventsByUserId = async (
  userId: string
): Promise<Event[]> => {
  const result: QueryResult<Event> = await pool.query(
    `SELECT * FROM events 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const findEventById = async (
  eventId: string,
  userId: string
): Promise<EventWithStats | null> => {
  const result = await pool.query(
    `SELECT 
      e.*,
      COUNT(DISTINCT da.endpoint_id) as total_endpoints,
      COUNT(DISTINCT CASE WHEN da.status = 'success' THEN da.endpoint_id END) as successful_endpoints,
      COUNT(DISTINCT CASE WHEN da.status = 'exhausted' THEN da.endpoint_id END) as failed_endpoints
     FROM events e
     LEFT JOIN delivery_attempts da ON da.event_id = e.id
     WHERE e.id = $1
     AND e.user_id = $2
     GROUP BY e.id`,
    [eventId, userId]
  );
  return result.rows[0] || null;
};

export const findEventStatusById = async (
  eventId: string
): Promise<{ status: string } | null> => {
  const result = await pool.query(
    `SELECT status FROM events WHERE id = $1`,
    [eventId]
  );
  return result.rows[0] || null;
};