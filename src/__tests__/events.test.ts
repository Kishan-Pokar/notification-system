import request from 'supertest';
import app from '../app';
import pool from '../db/client';

describe('Events', () => {
  let apiKey: string;

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1',
      ['eventtest@example.com']);

    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        name: 'Event Test',
        email: 'eventtest@example.com',
        password: 'password123'
      });

    apiKey = registerRes.body.api_key;

    // register an endpoint subscribed to payment.success
    await request(app)
      .post('/endpoints')
      .set('x-api-key', apiKey)
      .send({
        url: 'https://webhook.site/event-test-url',
        event_types: ['payment.success']
      });
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1',
      ['eventtest@example.com']);
    await pool.end();
  });

  it('should trigger event and return pending status', async () => {
    const res = await request(app)
      .post('/events')
      .set('x-api-key', apiKey)
      .send({
        event_type: 'payment.success',
        payload: { order_id: 'test-123', amount: 500 }
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.event_type).toBe('payment.success');
  });

  it('should return 404 for event with no subscribed endpoints', async () => {
    const res = await request(app)
      .post('/events')
      .set('x-api-key', apiKey)
      .send({
        event_type: 'unsubscribed.event',
        payload: { data: 'test' }
      });

    expect(res.status).toBe(404);
  });

  it('should return 400 for missing event_type', async () => {
    const res = await request(app)
      .post('/events')
      .set('x-api-key', apiKey)
      .send({
        payload: { data: 'test' }
      });

    expect(res.status).toBe(400);
  });
});

