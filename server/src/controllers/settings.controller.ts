import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as authService from '../services/auth.service';

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Podaj aktualne hasło'),
  newPassword: z.string().min(8, 'Nowe hasło musi mieć co najmniej 8 znaków'),
});

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await authService.changePassword(userId(req), currentPassword, newPassword);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
