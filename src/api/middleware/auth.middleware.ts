import { Request, Response, NextFunction } from 'express';
import { findByApiKey } from '../../repositories/user.repository';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ message: 'API key required' });
      return;
    }

    const user = await findByApiKey(apiKey);

    if (!user) {
      res.status(401).json({ message: 'Invalid API key' });
      return;
    }

    req.user = user;
    next();

  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};