import pool from '../db/client';
import { QueryResult } from 'pg';
import { User } from '../types/user.types'


export const createUser = async (
  name: string,
  email: string,
  hashedPassword: string,
  apiKey: string
): Promise<User> => {
  const result: QueryResult<User> = await pool.query(
    `INSERT INTO users (name, email, password, api_key)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, api_key, created_at`,
    [name, email, hashedPassword, apiKey]
  );

  return result.rows[0];
};

export const findByEmail = async (email: string): Promise<User | null> => {
  const result: QueryResult<User> = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
};

export const findById = async (id: string): Promise<Omit<User, 'password'> | null> => {
  const result = await pool.query(
    `SELECT id, name, email, api_key, created_at 
     FROM users 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};