import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

const isProd = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? ('none' as const) : ('lax' as const),
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function setTokenCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('accessToken', tokens.accessToken, {
    ...COOKIE_OPTS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const tokens = await authService.register(email, password, name);
    setTokenCookies(res, tokens);
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const tokens = await authService.login(email, password);
    setTokenCookies(res, tokens);
    res.json({ message: 'Logged in successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }
    const tokens = await authService.refresh(token);
    setTokenCookies(res, tokens);
    res.json({ message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (token) await authService.logout(token);
    res.clearCookie('accessToken', COOKIE_OPTS);
    res.clearCookie('refreshToken', COOKIE_OPTS);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe((req as AuthRequest).userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
