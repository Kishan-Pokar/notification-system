export interface Event {
  id: string;
  user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  created_at: Date;
};

export interface DeliveryAttempt {
    id: string;
    event_id: string;
    endpoint_id: string;
    attempt_number: number;
    status: 'success' | 'failed' | 'exhausted';
    http_status_code: number | null;
    response_body: string | null;
    error_message: string | null;
    duration_ms: number | null;
    attempted_at: Date;
};

export interface EventInput {
    event_type: string;
    payload: Record<string, unknown>;
};

export interface WebhookTarget {
    id: string;
    url: string;
    secret: string;
}

export interface CreateDeliveryAttemptInput {
  event_id: string;
  endpoint_id: string;
  attempt_number: number;
  status: 'success' | 'failed' | 'exhausted';
  http_status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  duration_ms: number | null;
}

export interface EventWithStats extends Event {
  total_endpoints: number;
  successful_endpoints: number;
  failed_endpoints: number;
}