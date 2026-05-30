import request from 'supertest';
import app from '../app';
import pool from '../db/client';

describe('Auth', () => {

  beforeAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', 
      ['test@example.com']);
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', 
      ['test@example.com']);
    await pool.end();
  });

  it('should register a new user and return api_key', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('api_key');
    expect(res.body.email).toBe('test@example.com');
  });

  it('should not register duplicate email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(409);
  });

  it('should login and return token', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });
});

