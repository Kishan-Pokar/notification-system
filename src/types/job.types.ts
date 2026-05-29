export interface JobPayload {
    url: string;
    secret: string;
    payload: Record<string, unknown>;
    event_id: string;
    endpoint_id: string;
};