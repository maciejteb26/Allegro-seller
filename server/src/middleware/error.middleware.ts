import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors.map((issue) => issue.message).join('; ');
    res.status(400).json({ error: message || 'Validation error' });
    return;
  }

  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
}
