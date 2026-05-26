import { User } from './user.types';

declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>;
    }
  }
}