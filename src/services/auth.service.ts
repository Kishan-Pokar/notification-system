import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createUser, findByEmail } from '../repositories/user.repository';
import { CreateUserInput, User } from '../types/user.types';
import { config } from '../config/index';

export const registerUser = async (input: CreateUserInput): Promise<Omit<User, 'password'>> => {
  const existing = await findByEmail(input.email);
  if (existing) throw new Error('Email already registered');

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const apiKey = crypto.randomBytes(32).toString('hex');

  const user = await createUser(
    input.name,
    input.email,
    hashedPassword,
    apiKey
  );

  return user;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ token: string }> => {

  const user = await findByEmail(email);
  if (!user) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');

  const token = jwt.sign(
    { userId: user.id },
    config.jwtSecret,
    { expiresIn: '7d' }
  );

  return { token };
};