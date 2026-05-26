import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index';
import { findById } from '../../repositories/user.repository';

interface JwtPayload {
  userId: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const user = await findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }

    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};