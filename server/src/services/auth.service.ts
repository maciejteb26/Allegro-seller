import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';
import { AppError } from '../middleware/error.middleware';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export async function register(email: string, password: string, name: string): Promise<TokenPair> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'Email already in use');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });

  return createTokenPair(user.id);
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Invalid credentials');

  return createTokenPair(user.id);
}

export async function refresh(token: string): Promise<TokenPair> {
  let payload: { userId: string };
  try {
    payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new AppError(401, 'Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, 'Refresh token expired or revoked');
  }

  await prisma.refreshToken.delete({ where: { token } });
  return createTokenPair(payload.userId);
}

export async function logout(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'User not found');
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError(400, 'Aktualne hasło jest nieprawidłowe');
  const newHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, plan: true, createdAt: true },
  });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

async function createTokenPair(userId: string): Promise<TokenPair> {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({ data: { userId, token: refreshToken, expiresAt } });

  return { accessToken, refreshToken };
}
