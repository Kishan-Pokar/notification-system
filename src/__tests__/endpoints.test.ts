import request from 'supertest';
import app from '../app';
import pool from '../db/client';

describe('Endpoints', () => {
  let apiKey: string;
  let endpointId: string;

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1',
      ['endpointtest@example.com']);

    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Endpoint Test',
        email: 'endpointtest@example.com',
        password: 'password123'
      });

    apiKey = res.body.api_key;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1',
      ['endpointtest@example.com']);
    await pool.end();
  });

  it('should register an endpoint', async () => {
    const res = await request(app)
      .post('/endpoints')
      .set('x-api-key', apiKey)
      .send({
        url: 'https://webhook.site/test-unique-url',
        event_types: ['payment.success']
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('secret');
    endpointId = res.body.id;
  });

  it('should not register duplicate endpoint url', async () => {
    const res = await request(app)
      .post('/endpoints')
      .set('x-api-key', apiKey)
      .send({
        url: 'https://webhook.site/test-unique-url',
        event_types: ['payment.success']
      });

    expect(res.status).toBe(409);
  });

  it('should reject duplicate event types in request', async () => {
    const res = await request(app)
      .post('/endpoints')
      .set('x-api-key', apiKey)
      .send({
        url: 'https://webhook.site/another-url',
        event_types: ['payment.success', 'payment.success']
      });

    expect(res.status).toBe(400);
  });

  it('should add event type to endpoint', async () => {
    const res = await request(app)
      .post(`/endpoints/${endpointId}/subscriptions`)
      .set('x-api-key', apiKey)
      .send({ event_type: 'order.delivered' });

    expect(res.status).toBe(200);
  });

  it('should not add duplicate event type', async () => {
    const res = await request(app)
      .post(`/endpoints/${endpointId}/subscriptions`)
      .set('x-api-key', apiKey)
      .send({ event_type: 'order.delivered' });

    expect(res.status).toBe(409);
  });

  it('should delete endpoint', async () => {
    const res = await request(app)
      .delete(`/endpoints/${endpointId}`)
      .set('x-api-key', apiKey);

    expect(res.status).toBe(200);
  });

  it('should reject requests without api key', async () => {
    const res = await request(app)
      .post('/endpoints')
      .send({
        url: 'https://webhook.site/no-auth',
        event_types: ['payment.success']
      });

    expect(res.status).toBe(401);
  });
});

