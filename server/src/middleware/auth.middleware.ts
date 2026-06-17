import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) throw new AppError(401, 'Not authenticated');

    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch {
    logger.security('auth_failed', { ip: req.ip, path: req.path });
    next(new AppError(401, 'Not authenticated'));
  }
}
