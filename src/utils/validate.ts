import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { BadRequestError } from './errors';

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues[0].message;
      return next(new BadRequestError(message));
    }
    req.body = result.data;
    next();
  };
};