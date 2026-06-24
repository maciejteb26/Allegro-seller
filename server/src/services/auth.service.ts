import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { prisma } from '../utils/prisma';
import { env } from '../utils/env';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { PASSWORD_MIN_LENGTH, PASSWORD_RESET_SUCCESS_MESSAGE, PASSWORD_RESET_TTL_MS } from '../constants/auth';
import { sendPasswordResetEmail } from './email.service';

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
  // jwtid gwarantuje unikalność tokenu nawet przy wielu logowaniach tego samego
  // usera w tej samej sekundzie (inaczej payload+exp są identyczne -> ten sam
  // string -> konflikt unique constraint na RefreshToken.token).
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: `${REFRESH_TOKEN_TTL_DAYS}d`,
    jwtid: randomUUID(),
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
  if (!user) {
    logger.security('login_failed', { email, reason: 'no_such_user' });
    throw new AppError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    logger.security('login_failed', { email, reason: 'bad_password' });
    throw new AppError(401, 'Invalid credentials');
  }

  logger.security('login_success', { userId: user.id });
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
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    logger.security('password_reset_requested_unknown_email', { email });
    return { message: PASSWORD_RESET_SUCCESS_MESSAGE };
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);
  logger.security('password_reset_requested', { userId: user.id });

  return { message: PASSWORD_RESET_SUCCESS_MESSAGE };
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    throw new AppError(400, `Hasło musi mieć co najmniej ${PASSWORD_MIN_LENGTH} znaków`);
  }

  const tokenHash = hashResetToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new AppError(400, 'Link do resetu hasła jest nieprawidłowy lub wygasł');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, id: { not: record.id } },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  logger.security('password_reset_completed', { userId: record.userId });
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
