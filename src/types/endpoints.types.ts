export interface Endpoint {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  is_active: boolean;
  created_at: Date;
}

export interface EndpointSubscription {
  id: string;
  endpoint_id: string;
  event_type: string;
  created_at: Date;
}

export interface CreateEndpointInput {
  url: string;
  event_types: string[];  
}